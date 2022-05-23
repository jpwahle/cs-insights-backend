import express, { NextFunction } from 'express';
import mongoose from 'mongoose';
import restify from 'express-restify-mongoose';
import * as DocumentTypes from '../models/interfaces';
import { APIOptions } from '../../config/interfaces';
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
