import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { buildFindObject, buildMatchObject, getMatchObject } from './filter';
import { UNKNOWN } from '../../../config/consts';
import { DatapointOverTime } from '../../../types';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // papers endpoint
  const route = `${options.server.baseRoute}/fe/papers`;

  router.get(
    route + '/stats',
    passport.authenticate('user', { session: false }),
    async (
      req: express.Request<{}, {}, {}, { yearStart: string; yearEnd: string }>,
      res: express.Response
    ) => {
      try {
        const matchObject = buildMatchObject(req.query);
        const timeData = await model.aggregate([
          matchObject,
          {
            $group: {
              _id: {
                $year: '$datePublished',
              },
              cites: {
                $sum: {
                  $size: '$cites',
                },
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
              cites: {
                $push: '$cites',
              },
            },
          },
          {
            $unset: '_id',
          },
        ]);
        let data: DatapointOverTime[] = timeData[0] || { years: [], cites: [] };
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
      req: express.Request<
        {},
        {},
        {},
        { page: string; pageSize: string; yearStart: string; yearEnd: string }
      >,
      res: express.Response
    ) => {
      const findObject = buildFindObject(req.query);
      const pageSize = parseInt(req.query.pageSize);
      const page = parseInt(req.query.page);
      if ((page != 0 && !page) || !pageSize) {
        res.status(422).json({
          message: 'The request is missing the required parameter "page" or "pageSize".',
        });
      } else {
        try {
          const rowCount = await model.find(findObject).countDocuments();
          const rows = await model.aggregate([
            getMatchObject(findObject),
            {
              $lookup: {
                from: 'venues',
                localField: 'venues',
                foreignField: '_id',
                as: 'venues',
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
                year: {
                  $year: '$datePublished',
                },
                cites: {
                  $size: '$cites',
                },
                title: 1,
                authors: '$authors.fullname',
                venues: {
                  $ifNull: [{ $arrayElemAt: ['$venues.names', 0] }, [UNKNOWN]],
                },
              },
            },
            {
              $sort: {
                cites: -1,
              },
            },
            { $skip: page * pageSize },
            { $limit: pageSize },
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
}