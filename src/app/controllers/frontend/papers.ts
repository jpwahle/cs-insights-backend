import express from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import NodeCache = require('node-cache');
import * as DocumentTypes from '../../models/interfaces';
import { Paper } from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import {
  buildFindObject,
  buildMatchObject,
  buildSortObject,
  fixYearData,
  getMatchObject,
  quartilePosition,
} from './queryUtils';
import { NA, NA_GROUPS } from '../../../config/consts';
import {
  DatapointsOverTime,
  PagedParameters,
  Pattern,
  QueryFilters,
  TopKParameters,
} from '../../../types';

const passport = require('passport');
// Cache time is unlimited. When the data doesn't change, it's fine.
// When the data changes, we should set stdTTL https://www.npmjs.com/package/node-cache

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // papers endpoint
  const route = `${options.server.baseRoute}/fe/papers`;
  const appCache = new NodeCache({ stdTTL: options.server.cacheTTL });

  // TODO: How to make it super fast: use .count() instead of .aggregate() and
  // run it for all years that are passed in req.query.yearStart and req.query.yearEnd
  router.get(
    route + '/years',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        try {
          const matchObject = buildMatchObject(req.query);
          const timeData = await model.aggregate([
            matchObject,
            {
              $group: {
                _id: '$yearPublished',
                counts: { $count: {} },
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
                  $push: '$counts',
                },
              },
            },
            {
              $unset: '_id',
            },
          ]);
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
        const findObject = buildFindObject(req.query);
        const pageSize = parseInt(req.query.pageSize);
        const page = parseInt(req.query.page);
        if ((page != 0 && !page) || !pageSize) {
          res.status(422).json({
            message: 'The request is missing the required parameter "page", "pageSize".',
          });
        } else {
          try {
            const rowCountPromise = model.find(findObject as FilterQuery<Paper>).countDocuments();
            const rowsPromise = model.aggregate([
              getMatchObject(findObject),
              buildSortObject(req.query.sortField, req.query.sortDirection),
              { $skip: page * pageSize },
              { $limit: pageSize },
              {
                $project: {
                  yearPublished: 1,
                  inCitationsCount: 1,
                  title: 1,
                  authors: {
                    $cond: {
                      if: { $arrayElemAt: ['$authors', 0] },
                      then: '$authors',
                      else: [NA_GROUPS],
                    },
                  },
                  venue: { $ifNull: ['$venue', NA_GROUPS] },
                  pdfUrl: { $arrayElemAt: ['$pdfUrls', 0] },
                },
              },
            ]);
            Promise.all([rowCountPromise, rowsPromise]).then((values) => {
              const data = {
                rowCount: values[0],
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
    }
  );

  router.get(
    route + '/quartiles',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        try {
          const findObject = buildFindObject(req.query);
          const rowCount = await model.find(findObject as FilterQuery<Paper>).countDocuments();
          let data: number[];
          if (rowCount === 0) {
            data = [0, 0, 0, 0, 0];
          } else {
            const positions = [0, 0.25, 0.5, 0.75, 1.0].map((quartile) =>
              quartilePosition(rowCount, quartile)
            );
            const quartileData = await model
              .aggregate([
                getMatchObject(findObject),
                { $sort: { inCitationsCount: 1 } },
                { $project: { inCitationsCount: 1 } },
                {
                  $facet: {
                    min: [{ $skip: positions[0] }, { $limit: 1 }],
                    first: [{ $skip: positions[1] }, { $limit: 1 }],
                    median: [{ $skip: positions[2] }, { $limit: 1 }],
                    third: [{ $skip: positions[3] }, { $limit: 1 }],
                    max: [{ $skip: positions[4] }, { $limit: 1 }],
                  },
                },
              ])
              .allowDiskUse(true);

            data = [
              quartileData[0].min[0].inCitationsCount,
              quartileData[0].first[0].inCitationsCount,
              quartileData[0].median[0].inCitationsCount,
              quartileData[0].third[0].inCitationsCount,
              quartileData[0].max[0].inCitationsCount,
            ];
          }
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
        if (!k) {
          res.status(422).json({
            message: 'The request is missing the required parameter "k".',
          });
        } else {
          try {
            let matchObject = buildMatchObject(req.query);
            const data = await model.aggregate([
              matchObject,
              {
                $sort: {
                  inCitationsCount: -1,
                },
              },
              { $limit: k },
              {
                $project: {
                  x: { $ifNull: ['$title', NA] },
                  y: '$inCitationsCount',
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

  router.get(
    route + '/list',
    passport.authenticate('user', { session: false }),
    async (
      req: express.Request<{}, {}, {}, QueryFilters & PagedParameters & Pattern>,
      res: express.Response
    ) => {
      const key = '__express__' + req.originalUrl;
      if (appCache.has(key)) {
        res.json(appCache.get(key));
      } else {
        const pattern = req.query.pattern;
        const column = req.query.column;
        if (!column || !pattern) {
          res.status(422).json({
            message: 'The request is missing the required parameters "column" and/or "pattern".',
          });
        } else {
          try {
            const data = await model.distinct('' + column, {
              publisher: { $regex: pattern },
            });
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
