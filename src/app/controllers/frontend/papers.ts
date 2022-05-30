import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { buildFindObject, buildMatchObject, buildSortObject, getMatchObject } from './queryUtils';
import { NA } from '../../../config/consts';
import { DatapointsOverTime, FilterQuery, PagedParameters } from '../../../types';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // papers endpoint
  const route = `${options.server.baseRoute}/fe/papers`;

  router.get(
    route + '/years',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, FilterQuery>, res: express.Response) => {
      try {
        const matchObject = buildMatchObject(req.query);
        const timeData = await model.aggregate([
          matchObject,
          {
            $group: {
              _id: '$yearPublished',
              cites: {
                $sum: '$inCitationsCount',
              },
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
                $push: '$cites',
              },
            },
          },
          {
            $unset: '_id',
          },
        ]);
        let data: DatapointsOverTime = timeData[0] || { years: [], counts: [] };
        // fill missing years with 0s
        const min = 1936;
        const max = 2022;
        const start = req.query.yearStart ? parseInt(req.query.yearStart) : min;
        const end = req.query.yearEnd ? parseInt(req.query.yearEnd) : max;
        const entries = end - start;
        for (let i = 0; i <= entries; i++) {
          const year = start + i;
          if (data.years[i] !== year) {
            data.years.splice(i, 0, year);
            data.counts.splice(i, 0, 0);
          }
        }

        res.json(data);
      } catch (error: any) {
        /* istanbul ignore next */
        res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    route + '/paged',
    passport.authenticate('user', { session: false }),
    async (
      req: express.Request<{}, {}, {}, FilterQuery & PagedParameters>,
      res: express.Response
    ) => {
      console.log(req.query);
      const findObject = buildFindObject(req.query);
      const pageSize = parseInt(req.query.pageSize);
      const page = parseInt(req.query.page);
      if ((page != 0 && !page) || !pageSize) {
        res.status(422).json({
          message: 'The request is missing the required parameter "page", "pageSize".',
        });
      } else {
        try {
          const rowCount = await model.find(findObject).countDocuments();
          const rows = await model.aggregate([
            getMatchObject(findObject),
            {
              $lookup: {
                from: 'venues',
                localField: 'venue',
                foreignField: '_id',
                as: 'venue',
              },
            },
            {
              $lookup: {
                from: 'authors',
                localField: 'authors',
                foreignField: '_id',
                as: 'authors',
              },
            },
            {
              $project: {
                yearPublished: 1,
                inCitationsCount: 1,
                title: 1,
                authors: { $ifNull: ['$authors.fullname', NA] },
                venue: {
                  $ifNull: [{ $arrayElemAt: ['$venues.names', 0] }, [NA]],
                },
              },
            },
            buildSortObject(req.query.sortField, req.query.sortDirection),
            { $skip: page * pageSize },
            { $limit: pageSize },
          ]);
          const data = {
            rowCount: rowCount,
            rows: rows,
          };
          console.log(data);
          res.json(data);
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
