import express from 'express';
import mongoose from 'mongoose';
import NodeCache from 'node-cache';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import {
  DatapointsOverTime,
  Metric,
  PagedParameters,
  QueryFilters,
  TopKParameters,
} from '../../../types';
import { buildMatchObject, buildSortObject, computeQuartiles, fixYearData } from './queryUtils';
import { NA_GROUPS } from '../../../config/consts';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // fieldsOfStudy endpoint
  const route = `${options.server.baseRoute}/fe/fields`;
  const appCache = new NodeCache({ stdTTL: options.server.cacheTTL });

  router.get(
    route + '/years',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        try {
          const timeData = await model
            .aggregate([
              buildMatchObject(req.query),
              { $unwind: '$fieldsOfStudy' },
              {
                $group: {
                  _id: '$yearPublished',
                  fieldsOfStudy: { $addToSet: '$fieldsOfStudy' },
                },
              },
              {
                $project: {
                  _id: 1,
                  count: { $size: '$fieldsOfStudy' },
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
            ])
            .allowDiskUse(true);
          let data: DatapointsOverTime = timeData[0] || { years: [], counts: [] };
          fixYearData(data, req.query.yearStart, req.query.yearEnd);
          appCache.set(key, data);
          res.json(data);
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
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
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        const matchObject = buildMatchObject(req.query);
        try {
          const rowCountPromise = model
            .aggregate([
              matchObject,
              {
                $unwind: {
                  path: '$fieldsOfStudy',
                  preserveNullAndEmptyArrays: true,
                },
              },
              { $group: { _id: '$fieldsOfStudy' } },
              { $count: 'count' },
            ])
            .allowDiskUse(true);
          const rowsPromise = model
            .aggregate([
              matchObject,
              {
                $unwind: {
                  path: '$fieldsOfStudy',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $group: {
                  _id: '$fieldsOfStudy',
                  papersCount: { $sum: 1 },
                  inCitationsCount: { $sum: '$inCitationsCount' },
                  yearPublishedFirst: { $min: '$yearPublished' },
                  yearPublishedLast: { $max: '$yearPublished' },
                },
              },
              {
                $project: {
                  _id: { $ifNull: ['$_id', NA_GROUPS] },
                  fieldsOfStudy: { $ifNull: ['$_id', NA_GROUPS] },
                  yearPublishedFirst: 1,
                  yearPublishedLast: 1,
                  papersCount: 1,
                  inCitationsCount: 1,
                  inCitationsPerPaper: { $divide: ['$inCitationsCount', '$papersCount'] },
                },
              },
              buildSortObject(req.query.sortField, req.query.sortDirection),
            ])
            .allowDiskUse(true);
          Promise.all([rowCountPromise, rowsPromise]).then((values) => {
            const data = {
              rowCount: values[0][0] ? values[0][0].count : 0,
              rows: values[1],
            };
            appCache.set(key, data);
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
    async (req: express.Request<{}, {}, {}, QueryFilters & Metric>, res: express.Response) => {
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        const metric = req.query.metric;
        if (!metric) {
          res.status(422).json({
            message: 'The request is missing the required parameter "metric".',
          });
        } else {
          try {
            const quartileData = await model
              .aggregate([
                buildMatchObject(req.query),
                {
                  $unwind: {
                    path: '$fieldsOfStudy',
                  },
                },
                {
                  $group: {
                    _id: '$fieldsOfStudy',
                    inCitationsCount: { $sum: '$inCitationsCount' },
                    count: {
                      $sum: req.query.metric === 'inCitationsCount' ? '$inCitationsCount' : 1,
                    },
                  },
                },
                {
                  $sort: {
                    count: 1,
                  },
                },
              ])
              .allowDiskUse(true);
            const data = computeQuartiles(quartileData);
            appCache.set(key, data);
            res.json(data);
          } catch (error: any) {
            /* istanbul ignore next */
            res.status(500).json({ message: error.message });
          }
        }
      }
    }
  );

  router.get(
    route + '/topk',
    passport.authenticate('user', { session: false }),
    async (
      req: express.Request<{}, {}, {}, QueryFilters & TopKParameters>,
      res: express.Response
    ) => {
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        const k = parseInt(req.query.k);
        const metric = req.query.metric;
        if (!k || !metric) {
          res.status(422).json({
            message: 'The request is missing the required parameter "k" and/or "metric".',
          });
        } else {
          try {
            const data = await model.aggregate([
              buildMatchObject(req.query),
              {
                $unwind: {
                  path: '$fieldsOfStudy',
                },
              },
              {
                $group: {
                  _id: '$fieldsOfStudy',
                  count: {
                    $sum: metric === 'inCitationsCount' ? '$inCitationsCount' : 1,
                  },
                },
              },
              {
                $sort: {
                  count: -1,
                },
              },
              { $limit: k },
              {
                $project: {
                  x: '$_id',
                  y: '$count',
                  _id: 0,
                },
              },
            ]);
            appCache.set(key, data);
            res.json(data);
          } catch (error: any) {
            /* istanbul ignore next */
            res.status(500).json({ message: error.message });
          }
        }
      }
    }
  );
}