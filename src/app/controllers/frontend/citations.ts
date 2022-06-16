import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { DatapointsOverTime, QueryFilters } from '../../../types';
import { buildMatchObject, fixYearData } from './queryUtils';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // citations endpoint
  const route = `${options.server.baseRoute}/fe/citations`;

  async function citationsYears(
    req: express.Request<{}, {}, {}, QueryFilters>,
    res: express.Response,
    field: string
  ) {
    try {
      const matchObject = buildMatchObject(req.query);
      const timeData = await model.aggregate([
        matchObject,
        {
          $group: {
            _id: '$yearPublished',
            cites: {
              $sum: field,
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

  router.get(
    route + 'In/years',
    passport.authenticate('user', { session: false }),
    (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      citationsYears(req, res, '$inCitationsCount');
    }
  );

  router.get(
    route + 'Out/years',
    passport.authenticate('user', { session: false }),
    (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      citationsYears(req, res, '$outCitationsCount');
    }
  );
}
