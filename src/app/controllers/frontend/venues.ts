import express from 'express';
import mongoose from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Venue>,
  router: express.Router,
  options: APIOptions
) {
  // venues endpoint
  const route = `${options.server.baseRoute}/fe/venues`;
  router.get(
    route + '/list',
    passport.authenticate('jwt', { session: false }),
    async (req: express.Request, res: express.Response) => {
      const pattern = req.query.pattern;
      if (!pattern) {
        res.status(422).json({
          message: 'The request is missing the required parameter "pattern".',
        });
      } else {
        try {
          // const venueData = await model.find(
          //   { names: { $regex: pattern } },
          // { names: { $first: '$names' } }
          // );
          const venueData = await model.aggregate([
            { $match: { names: { $regex: pattern } } },
            { $project: { names: { $first: '$names' } } },
          ]);

          res.json(venueData);
        } catch (error: any) {
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
