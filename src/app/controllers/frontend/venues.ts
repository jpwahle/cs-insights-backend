import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { DatapointsOverTime, PagedParameters, QueryFilters } from '../../../types';
import { buildMatchObject, buildSortObject, computeQuartiles, fixYearData } from './queryUtils';
import { NA } from '../../../config/consts';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  modelVenue: mongoose.Model<DocumentTypes.Venue>,
  router: express.Router,
  options: APIOptions
) {
  // venues endpoint
  const route = `${options.server.baseRoute}/fe/venues`;

  router.get(
    route + '/years',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      try {
        const timeData = await model.aggregate([
          buildMatchObject(req.query),
          {
            $group: {
              _id: '$yearPublished',
              venues: { $addToSet: '$venueId' },
            },
          },
          {
            $project: {
              _id: 1,
              count: { $size: '$venues' },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
          {
            $group: {
              _id: '',
              years: {
                $push: '$_id',
              },
              counts: {
                $push: '$count',
              },
            },
          },
          {
            $unset: '_id',
          },
        ]);
        let data: DatapointsOverTime = timeData[0] || { years: [], counts: [] };
        fixYearData(data, req.query.yearStart, req.query.yearEnd);
        res.json(data);
      } catch (error: any) {
        /* istanbul ignore next */
        res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    route + '/info',
    passport.authenticate('user', { session: false }),
    async (
      req: express.Request<{}, {}, {}, QueryFilters & PagedParameters>,
      res: express.Response
    ) => {
      const matchObject = buildMatchObject(req.query);
      const pageSize = parseInt(req.query.pageSize);
      const page = parseInt(req.query.page);
      if ((page != 0 && !page) || !pageSize) {
        res.status(422).json({
          message: 'The request is missing the required parameter "page", "pageSize".',
        });
      } else {
        try {
          const rowCountPromise = model.aggregate([
            matchObject,
            { $group: { _id: '$venue' } },
            { $count: 'count' },
          ]);
          const rowsPromise = model.aggregate([
            matchObject,
            {
              $group: {
                _id: '$venue',
                papersCount: { $sum: 1 },
                inCitationsCount: { $sum: '$inCitationsCount' },
                yearPublishedFirst: { $min: '$yearPublished' },
                yearPublishedLast: { $max: '$yearPublished' },
              },
            },
            {
              $project: {
                _id: { $ifNull: ['$_id', NA] },
                venue: { $ifNull: ['$_id', NA] },
                yearPublishedFirst: 1,
                yearPublishedLast: 1,
                papersCount: 1,
                inCitationsCount: 1,
                inCitationsPerPaper: { $divide: ['$inCitationsCount', '$papersCount'] },
                link: { $concat: ['https://dblp.org/search?q=', '$_id'] },
              },
            },
            buildSortObject(req.query.sortField, req.query.sortDirection),
            { $skip: page * pageSize },
            { $limit: pageSize },
          ]);
          Promise.all([rowCountPromise, rowsPromise]).then((values) => {
            const data = {
              rowCount: values[0][0] ? values[0][0].count : 0,
              rows: values[1],
            };
            res.json(data);
          });
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );

  router.get(
    route + '/quartiles',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      try {
        // let start;
        // let end;
        // start = performance.now();
        // const rowCount = (
        //   await model.aggregate([
        //     matchObject,
        //     { $group: { _id: '$venue' } },
        //     {
        //       $count: 'count',
        //     },
        //   ])
        // )[0].count;

        const quartileData = await model
          .aggregate([
            buildMatchObject(req.query),
            {
              $group: {
                _id: '$venue',
                inCitationsCount: { $sum: '$inCitationsCount' },
              },
            },
            { $sort: { inCitationsCount: 1 } },
            // { $project: { inCitationsCount: 1 } },
            // {
            //   $facet: {
            //     min: [{ $limit: 1 }],
            //     first: [{ $skip: Math.floor(rowCount * 0.25) }, { $limit: 1 }],
            //     median: [{ $skip: Math.floor(rowCount * 0.5) }, { $limit: 1 }],
            //     third: [{ $skip: Math.floor(rowCount * 0.75) }, { $limit: 1 }],
            //     max: [{ $skip: rowCount - 1 }, { $limit: 1 }],
            //   },
            // },
          ])
          .allowDiskUse(true);

        const response = computeQuartiles(quartileData);

        // const response = [
        //   quartileData[0].min[0].inCitationsCount,
        //   quartileData[0].first[0].inCitationsCount,
        //   quartileData[0].median[0].inCitationsCount,
        //   quartileData[0].third[0].inCitationsCount,
        //   quartileData[0].max[0].inCitationsCount,
        // ];
        // end = performance.now();
        // console.log(end - start);
        res.json(response);
      } catch (error: any) {
        /* istanbul ignore next */
        res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    route + '/topk',
    passport.authenticate('user', { session: false }),
    async (
      req: express.Request<{}, {}, {}, QueryFilters & PagedParameters>,
      res: express.Response
    ) => {
      // const pageSize = parseInt(req.query.pageSize);
      const page = parseInt(req.query.page);
      const pageSize = 2000;
      if ((page != 0 && !page) || !pageSize) {
        res.status(422).json({
          message: 'The request is missing the required parameter "page", "pageSize".',
        });
      } else {
        try {
          const topkData = await model.aggregate([
            buildMatchObject(req.query),
            {
              $group: {
                _id: '$venue',
                inCitationsCount: { $sum: '$inCitationsCount' },
              },
            },
            buildSortObject(req.query.sortField, 'desc'),
            { $limit: pageSize },
            {
              $project: {
                x: { $ifNull: ['$_id', NA] },
                y: '$inCitationsCount',
                _id: 0,
              },
            },
          ]);
          res.json(topkData);
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );

  router.get(
    route + '/list',
    passport.authenticate('user', { session: false }),
    async (req: express.Request, res: express.Response) => {
      const pattern = req.query.pattern;
      if (!pattern) {
        res.status(422).json({
          message: 'The request is missing the required parameter "pattern".',
        });
      } else {
        try {
          // if the schema gets changed to only one name, this is faster
          // const venueData = await model.find(
          //   { names: { $regex: pattern } },
          // { names: { $first: '$names' } }
          // );
          const venueData = await modelVenue.aggregate([
            { $match: { names: { $regex: pattern } } },
            { $project: { names: { $first: '$names' } } },
          ]);

          res.json(venueData);
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
