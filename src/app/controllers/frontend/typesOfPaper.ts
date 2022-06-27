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
  router: express.Router,
  options: APIOptions
) {
  // typesOfPaper endpoint
  const route = `${options.server.baseRoute}/fe/types`;

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
              typeOfPaper: { $addToSet: '$typeOfPaper' },
            },
          },
          {
            $project: {
              _id: 1,
              count: { $size: '$typeOfPaper' },
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
      try {
        const rowCountPromise = model.aggregate([
          matchObject,
          { $group: { _id: '$typeOfPaper' } },
          { $count: 'count' },
        ]);
        const rowsPromise = model.aggregate([
          matchObject,
          {
            $group: {
              _id: '$typeOfPaper',
              papersCount: { $sum: 1 },
              inCitationsCount: { $sum: '$inCitationsCount' },
              yearPublishedFirst: { $min: '$yearPublished' },
              yearPublishedLast: { $max: '$yearPublished' },
            },
          },
          {
            $project: {
              _id: { $ifNull: ['$_id', NA] },
              typeOfPaper: { $ifNull: ['$_id', NA] },
              yearPublishedFirst: 1,
              yearPublishedLast: 1,
              papersCount: 1,
              inCitationsCount: 1,
              inCitationsPerPaper: { $divide: ['$inCitationsCount', '$papersCount'] },
            },
          },
          buildSortObject(req.query.sortField, req.query.sortDirection),
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
  );

  router.get(
    route + '/quartiles',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      try {
        const quartileData = await model
          .aggregate([
            buildMatchObject(req.query),
            {
              $group: {
                _id: '$typeOfPaper',
                inCitationsCount: { $sum: '$inCitationsCount' },
              },
            },
            { $sort: { inCitationsCount: 1 } },
          ])
          .allowDiskUse(true);
        const response = computeQuartiles(quartileData);
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
      const pageSize = parseInt(req.query.pageSize);
      const page = parseInt(req.query.page);
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
                _id: '$typeOfPaper',
                inCitationsCount: { $sum: '$inCitationsCount' },
              },
            },
            buildSortObject(req.query.sortField, 'desc'),
            { $limit: pageSize },
            {
              $project: {
                x: '$_id',
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
}
