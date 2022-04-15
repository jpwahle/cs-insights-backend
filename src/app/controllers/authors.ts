import express, { NextFunction } from 'express';
import mongoose from 'mongoose';
import restify from 'express-restify-mongoose';
import * as DocumentTypes from '../models/interfaces';
import { APIOptions } from '../../config/interfaces';
import { PaperStats } from '../../types';
const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Author>,
  router: express.Router,
  options: APIOptions
) {
  // authors endpoint
  restify.serve(router, model, {
    name: 'authors',
    preMiddleware: passport.authenticate('jwt', { session: false }),
    prefix: options.server.prefix,
    version: options.server.version,
    preCreate: (req: any, res: express.Response, next: NextFunction) => {
      if (req.user.isAdmin) {
        // Add who created the author and when
        req.body.createdBy = req.user._id;
        req.body.createdAt = new Date();
        return next();
      }

      return res.status(403).json({
        message: 'Only admins can create new authors using the author API',
      });
    },
    // disable user modification, except for admins and the creator itself
    preUpdate: (req: any, res: express.Response, next: NextFunction) => {
      // allow update for user of the author and admins
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
        message: 'Only admins or the user itself can update author properties',
      });
    },

    // disable deletion, except for admins and the creator itself
    preDelete: (req: any, res: express.Response, next: NextFunction) => {
      // allow update for user of the author and admins
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
        message: 'Only admins and the creator can delete an author',
      });
    },
  });

  router.get(
    `${options.server.baseRoute}/fe/authors/list`,
    passport.authenticate('jwt', { session: false }),
    async (req: express.Request, res: express.Response) => {
      const pattern = req.query.pattern;
      if (!pattern) {
        res.status(422).json({
          message: 'The request is missing the required parameter "pattern".',
        });
      } else {
        try {
          const authorData = await model.find({ fullname: { $regex: pattern } }, { fullname: 1 });
          console.log(authorData.length);
          res.json(authorData);
        } catch (error: any) {
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
