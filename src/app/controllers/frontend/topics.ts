//@ts-nocheck
import express from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import { APIOptions } from '../../../config/interfaces';
import { ModelId, QueryFilters } from '../../../types';
import * as DocumentTypes from '../../models/interfaces';
import { Paper } from '../../models/interfaces';
import { buildFindObject } from './queryUtils';

const passport = require('passport');

export function initialize(
  model: mongoose.Model<DocumentTypes.Paper>,
  router: express.Router,
  options: APIOptions
) {
  // topics endpoint
  const route = `${options.server.baseRoute}/fe/topics`;

  router.get(
    route + '/models',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
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

  router.get(
    route + '/lda',
    passport.authenticate('user', { session: false }),
    async (req: express.Request<{}, {}, {}, QueryFilters & ModelId>, res: express.Response) => {
      const modelId = req.query.modelId;
      if (!modelId) {
        res.status(422).json({
          message:
            'The request is missing the required parameter "modelId". Please select a modelId and try again.',
        });
      } else {
        const findObject = buildFindObject(req.query);
        try {
          if (process.env.LDA_PAPER_LIMIT) {
            const rowCount = await model.find(findObject as FilterQuery<Paper>).countDocuments();
            if (rowCount >= parseInt(process.env.LDA_PAPER_LIMIT)) {
              res.status(413).json({
                message: `The request would process over ${process.env.LDA_PAPER_LIMIT} papers. Please try again after applying more filters.`,
              });
            }
          }
          const textData = await model.find(findObject as FilterQuery<Paper>).select({
            title: 1,
            abstractText: 1,
            _id: 0,
          });
          if (textData.length === 0) {
            res.status(400).json({
              message: `The selection is empty. Please try again after applying less filters.`,
            });
          } else {
            //query predictions endpoint
            const url = `http://${process.env.PREDICTION_ENDPOINT_HOST}:${process.env.PREDICTION_ENDPOINT_PORT}/api/v0/models/${modelId}`;
            const init = {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                function_call: 'getLDAvis',
                input_data: { data: textData },
              }),
            };
            const response = await fetch(url, init);
            const json = await response.json();
            res.status(response.status).json(json);
          }
        } catch (error: any) {
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
