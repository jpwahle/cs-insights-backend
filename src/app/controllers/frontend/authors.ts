import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Author>,
  router: express.Router,
  options: APIOptions
) {
  // authors endpoint
  const route = `${options.server.baseRoute}/fe/authors`;

  router.get(
    route + '/list',
    passport.authenticate('user', { session: false }),
    async (req: express.Request, res: express.Response) => {
      const pattern = req.query.pattern;
      if (!pattern) {
        res.status(422).json({
          message: 'The request is missing the required parameter "pattern".',
        });
      } else {
        try {
          const authorData = await model.find(
            { fullname: { $regex: '\\b' + pattern, $options: 'i' } },
            { fullname: 1 }
          );
          res.json(authorData);
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
