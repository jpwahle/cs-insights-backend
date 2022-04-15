import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { PaperStats } from '../../../types';
import { UNKNOWN } from '../../../config/default';
import { buildMatchObject } from './filter';

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
    passport.authenticate('jwt', { session: false }),
    async (
      req: express.Request<{}, {}, {}, { yearStart: string; yearEnd: string }>,
      res: express.Response
    ) => {
      try {
        const matchObject = buildMatchObject(req.query);
        console.log(matchObject);
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
        let data: PaperStats = {
          timeData: timeData[0] || { years: [], cites: [] },
        };
        res.json(data);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    route + '/paged',
    passport.authenticate('jwt', { session: false }),
    async (
      req: express.Request<{}, {}, {}, { page: string; pageSize: string }>,
      res: express.Response
    ) => {
      const pageSize = parseInt(req.query.pageSize);
      const page = parseInt(req.query.page);
      if ((page != 0 && !page) || !pageSize) {
        res.status(422).json({
          message: 'The request is missing the required parameter "page" or "pageSize".',
        });
      } else {
        try {
          const rowCount = await model.countDocuments();
          const rows = await model.aggregate([
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
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
