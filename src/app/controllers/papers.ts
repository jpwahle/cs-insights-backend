import express, { NextFunction } from 'express';
import restify from 'express-restify-mongoose';
import mongoose from 'mongoose';
import { APIOptions } from '../../config/interfaces';
import * as DocumentTypes from '../models/interfaces';
import { addCreated } from './index';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router | express.Application,
  options: APIOptions
) {
  // papers endpoint
  restify.serve(router, model, {
    name: 'papers',
    preMiddleware: passport.authenticate('admin', { session: false }),
    prefix: options.server.prefix,
    version: options.server.version,
    preRead: async (req: any, res: express.Response, next: NextFunction) => {
      // If there is the "years" flag on the query, run a mongoose query to get the annual counts
      if (req.query.hasOwnProperty('years')) {
        const byYears = await model.aggregate([
          { $match: JSON.parse(req.query.query) },
          { $sort: { year: 1 } },
          {
            $group: {
              _id: '$year',
              count: { $count: {} },
            },
          },
          {
            $sort: {
              year: 1,
            },
          },
        ]);
        res.json(byYears);
      }
      // If there is the "venues" flag on the query, run a mongoose query to get the annual counts
      if (req.query.hasOwnProperty('venues')) {
        const byVenues = await model.aggregate([
          { $match: JSON.parse(req.query.query) },
          { $sort: { year: 1 } },
          {
            $group: {
              _id: '$venue',
              count: { $count: {} },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]);
        console.log(byVenues);
        res.json(byVenues);
      }
      // If there is no limit, limit max documents to 100
      if (!req.query.limit) {
        req.query.limit = 10;
      }
      next();
    },
    preCreate: (req: any, res: express.Response, next: NextFunction) => {
      if (req.user.isAdmin) {
        // Add who created the paper and when
        addCreated(req);
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
}
