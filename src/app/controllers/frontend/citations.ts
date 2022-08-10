import express from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { DatapointsOverTime, QueryFilters } from '../../../types';
import { buildFindObject, buildMatchObject, fixYearData, quartilePosition } from './queryUtils';
import { Paper } from '../../models/interfaces';

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
            count: {
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

  async function citationsQuartiles(
    req: express.Request<{}, {}, {}, QueryFilters>,
    res: express.Response,
    field: keyof Paper
  ) {
    try {
      const findObject = buildFindObject(req.query);
      const rowCount = await model.find(findObject as FilterQuery<Paper>).countDocuments();
      let response: number[];
      if (rowCount === 0) {
        response = [0, 0, 0, 0, 0];
      } else {
        const quartiles = [0, 0.25, 0.5, 0.75, 1.0].map((quartile) =>
          quartilePosition(rowCount, quartile)
        );
        let project = { [field]: 1 };
        const quartileData = await Promise.all(
          quartiles.map(
            async (quartile): Promise<Paper[]> =>
              model.find(findObject, project).sort(project).skip(quartile).limit(1)
          )
        );
        response = quartileData.map((quart) => quart[0][field]);
      }
      res.json(response);
    } catch (error: any) {
      /* istanbul ignore next */
      res.status(500).json({ message: error.message });
    }
  }

  router.get(
    route + 'In/quartiles',
    passport.authenticate('user', { session: false }),
    (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      citationsQuartiles(req, res, 'inCitationsCount');
    }
  );

  router.get(
    route + 'Out/quartiles',
    passport.authenticate('user', { session: false }),
    (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      citationsQuartiles(req, res, 'outCitationsCount');
    }
  );
}
