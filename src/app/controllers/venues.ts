import express, { NextFunction } from 'express';
import mongoose from 'mongoose';
import restify from 'express-restify-mongoose';
import * as DocumentTypes from '../models/interfaces';
import { APIOptions } from '../../config/interfaces';
import { addCreated } from './index';
const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Venue>,
  router: express.Router | express.Application,
  options: APIOptions
) {
  // venues endpoint
  restify.serve(router, model, {
    name: 'venues',
    preMiddleware: passport.authenticate('admin', { session: false }),
    prefix: options.server.prefix,
    version: options.server.version,

    preCreate: (req: any, res: express.Response, next: NextFunction) => {
      if (req.user.isAdmin) {
        // Add who created the venue and when
        addCreated(req);
        return next();
      }
      return res.status(403).json({
        message: 'Only admins can create new venues using the venues API',
      });
    },

    // disable user modification, except for admins
    preUpdate: (req: any, res: express.Response, next: NextFunction) => {
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
        message: 'Only admins can update venues properties',
      });
    },

    // disable deletion, except for admins
    preDelete: (req: any, res: express.Response, next: NextFunction) => {
      // allow update for admins
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
        message: 'Only admins can delete a venue',
      });
    },
  });
}
