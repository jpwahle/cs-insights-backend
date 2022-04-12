import express, { NextFunction } from 'express';
import mongoose from 'mongoose';
import restify from 'express-restify-mongoose';
import * as DocumentTypes from '../models/interfaces';
import { APIOptions } from '../../config/interfaces';
import { PaperStats } from '../../types';
import { UNKNOWN } from '../../config/default';
const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // papers endpoint
  restify.serve(router, model, {
    name: 'papers',
    preMiddleware: passport.authenticate('jwt', { session: false }),
    prefix: options.server.prefix,
    version: options.server.version,
    preCreate: (req: any, res: express.Response, next: NextFunction) => {
      if (req.user.isAdmin) {
        // Add who created the paper and when
        req.body.createdBy = req.user._id;
        req.body.createdAt = new Date();
        return next();
      }

      return res.status(403).json({
        message: 'Only admins can create new papers using the paper API',
      });
    },
    // disable user modification, except for admins and the creator itself
    preUpdate: (req: any, res: express.Response, next: NextFunction) => {
      // allow update for admins
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
        message: 'Only admins or the user itself can update paper properties',
      });
    },

    // disable deletion, except for admins and the creator itself
    preDelete: (req: any, res: express.Response, next: NextFunction) => {
      // allow update for admins
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
        message: 'Only admins and the creator can delete a paper',
      });
    },
  });

  router.get(
    `${options.server.baseRoute}/fe/papers/stats`,
    passport.authenticate('jwt', { session: false }),
    async (req: express.Request, res: express.Response) => {
      try {
        const timeData = await model.aggregate([
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
          timeData: timeData[0],
        };
        res.json(data);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    `${options.server.baseRoute}/fe/papers/paged`,
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
          const pageSize = parseInt(req.query.pageSize);
          const page = parseInt(req.query.page);

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
