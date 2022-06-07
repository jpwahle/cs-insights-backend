import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import {
  buildFindObject,
  buildMatchObject,
  buildSortObject,
  fixYearData,
  getMatchObject,
} from './queryUtils';
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
                // $push: { $ifNull: ['$_id', NA] },
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
        fixYearData(data, req.query.yearStart, req.query.yearEnd);
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
                from: 'authors',
                localField: 'authors',
                foreignField: '_id',
                as: 'authors',
              },
            },
            {
              $lookup: {
                from: 'venues',
                localField: 'venue',
                foreignField: '_id',
                as: 'venue',
              },
            },
            buildSortObject(req.query.sortField, req.query.sortDirection),
            { $skip: page * pageSize },
            { $limit: pageSize },
            {
              $project: {
                yearPublished: 1,
                inCitationsCount: 1,
                title: 1,
                authors: { $ifNull: ['$authors.fullname', NA] },
                venue: {
                  $ifNull: [{ $arrayElemAt: ['$venue.names', 0] }, NA],
                },
              },
            },
          ]);
          const data = {
            rowCount: rowCount,
            rows: rows,
          };
          res.json(data);
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
      const column = req.query.column;
      if (!column || !pattern) {
        res.status(422).json({
          message: 'The request is missing the required parameters "column" and/or "pattern".',
        });
      } else {
        try {
          const columnData = await model.distinct('' + column, {
            publisher: { $regex: pattern },
          });
          res.json(columnData);
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
