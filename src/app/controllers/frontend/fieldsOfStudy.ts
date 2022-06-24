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
  // fieldsOfStudy endpoint
  const route = `${options.server.baseRoute}/fe/fields`;

  router.get(
    route + '/years',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
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
                _id: { $ifNull: ['$_id', NA] },
                fieldsOfStudy: { $ifNull: ['$_id', NA] },
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
              $unwind: {
                path: '$fieldsOfStudy',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: '$fieldsOfStudy',
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
}
