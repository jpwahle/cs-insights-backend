import express, { NextFunction } from 'express';
import restify from 'express-restify-mongoose';
import mongoose from 'mongoose';
import { APIOptions } from '../../config/interfaces';
import * as DocumentTypes from '../models/interfaces';
import { addCreated } from './index';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // papers endpoint
  restify.serve(router, model, {
    name: 'topics',
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

    postRead: async (req: any, res: express.Response, next: NextFunction) => {
      const modelId = req.query.model_id;
      if (!modelId) {
        return res.status(422).json({
          message:
            'The request is missing the required parameter `model_id`. Please select a modelId and try again.',
        });
      } else {
        try {
          if (process.env.LDA_PAPER_LIMIT) {
            if (req.erm.result.length >= parseInt(process.env.LDA_PAPER_LIMIT)) {
              return res.status(413).json({
                message: `The request would process over ${process.env.LDA_PAPER_LIMIT} papers. Please try again after applying more filters.`,
              });
            }
          }
          const textData = req.erm.result.map((elem: any) => ({
            title: elem.title,
            abstractText: elem.abstract,
          }));
          if (textData.length === 0) {
            return res.status(400).json({
              message: `The selection is empty. Please try again after applying less filters.`,
            });
          } else {
            //query predictions endpoint
            const url = `http://${process.env.PREDICTION_ENDPOINT_HOST}:${process.env.PREDICTION_ENDPOINT_PORT}/api/v0/models/${modelId}`;
            const init = {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                function_call: 'getLDAvis',
                input_data: { data: textData },
              }),
            };
            const response = await fetch(url, init);
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
              const json = await response.json();
              return res.status(response.status).json(json);
            } else {
              return res.status(response.status).send();
            }
          }
        } catch (error: any) {
          /* istanbul ignore next */
          return res.status(500).json({ message: error.message });
        }
      }
    },
  });

  // Get models
  router.get(
    `${options.server.baseRoute}/models`,
    async (req: express.Request, res: express.Response) => {
      try {
        //query predictions endpoint
        const url = `http://${process.env.PREDICTION_ENDPOINT_HOST}:${process.env.PREDICTION_ENDPOINT_PORT}/api/v0/models`;
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const json = await response.json();
          res.status(response.status).json(json);
        } else {
          res.status(response.status);
          res.send();
        }
      } catch (error: any) {
        /* istanbul ignore next */
        res.status(500).json({ message: error.message });
      }
    }
  );
}
