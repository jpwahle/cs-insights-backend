//@ts-nocheck
/* eslint-disable */
import express from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import * as DocumentTypes from '../../models/interfaces';
import { Paper } from '../../models/interfaces';
import { APIOptions } from '../../../config/interfaces';
import { buildFindObject } from './queryUtils';
import { ModelId, QueryFilters } from '../../../types';
// var http = require('http');
const axios = require('axios').default;

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
        const url = `http://${process.env.PREDICTIONS_ENDPOINT_HOST}:${process.env.PREDICTIONS_ENDPOINT_PORT}/api/v0/models`;
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
            console.log(new Date());
            //query predictions endpoint
            const url = `http://${process.env.PREDICTIONS_ENDPOINT_HOST}:${process.env.PREDICTIONS_ENDPOINT_PORT}/api/v0/models/${modelId}`;
            console.log(url);
            // console.log(textData)
            // var logger = fs.createWriteStream('log.txt', {
            //   flags: 'a' // 'a' means appending (old data will be preserved)
            // })
            // logger.write("[")
            //  textData.map(el => logger.write(JSON.stringify(el) + ","))
            // logger.write("]")
            // data = fs.readFileSync('log.txt', 'utf8');
            // fs.writeFile("text.txt", textData,  function(err) {
            //   if(err) {
            //     return console.log(err);
            //   }
            //   console.log("The file was saved!");
            // });
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);
            console.log(timeoutId);
            const init = {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'application/x-www-form-urlencoded',
                // 'Content-Length': postData.length,
              },
              signal: controller.signal,
              body: JSON.stringify({
                functionCall: 'getLDAvis',
                inputData: { data: textData }, // "[" + textData.map(el => JSON.stringify(el)).join(",") + "]"
              }),
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
            };

            let counts = textData.reduce(
              (prev, curr) => {
                if (curr.title) {
                  prev.titles += 1;
                }
                if (curr.abstractText) {
                  prev.abstracts += 1;
                }
                return prev;
              },
              { titles: 0, abstracts: 0 }
            );
            console.log(
              `#papers: ${textData.length}\n#titles: ${counts.titles}\n#abstracts: ${counts.abstracts}`
            );
            console.log(`${textData.length}, ${counts.titles}, ${counts.abstracts}`);

            console.log('pre-fetch');
            console.log(new Date());

            let body = JSON.stringify({
              functionCall: 'getLDAvis',
              inputData: { data: textData }, // "[" + textData.map(el => JSON.stringify(el)).join(",") + "]"
            });

            let response = await axios
              .post(url, body, init)
              .then(function (response2) {
                // console.log(response);
                // console.log(response2.data);

                return response2;
              })
              .catch(function (error) {
                // console.log(error);
                console.log(error);
              });

            // console.log(test123);
            // let test21 = await test123;

            // console.log('11111111111');
            console.log('post-fetch');
            console.log(new Date());

            // console.log(response.headers['content-type']);
            const contentType = response.headers['content-type'];
            if (contentType && contentType.indexOf('application/json') !== -1) {
              const json = await response.data;
              res.status(response.status).json(json);
            } else {
              res.status(response.status);
              res.send();
            }

            // let options = {
            //   host: `${process.env.PREDICTIONS_ENDPOINT_HOST}`,
            //   path: `/api/v0/models/${modelId}`,
            //   port: `${process.env.PREDICTIONS_ENDPOINT_PORT}`,
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   // signal: controller.signal,
            // };

            // let post_req = http.request(options, (response) => {
            //   // Printing the statusCode
            //   response.on('data', (d) => {
            //     console.log(`STATUS: ${response.statusCode}`);
            //     console.log('post-fetch');
            //     console.log(new Date());
            //     // const contentType = response.headers.get('content-type');
            //     // if (contentType && contentType.indexOf('application/json') !== -1) {
            //     console.log(d);
            //     // const json = await response.json();
            //     // res.status(response.status).json(json);
            //     // } else {
            //     // res.status(response.status);
            //     // res.send();
            //     // }
            //   });
            // });
            // post_req.write(body);
            // post_req.end();

            // const response = await fetch(url, init);

            // console.log('post-fetch');
            // console.log(new Date());
            // const contentType = response.headers.get('content-type');
            // if (contentType && contentType.indexOf('application/json') !== -1) {
            //   const json = await response.json();
            //   res.status(response.status).json(json);
            // } else {
            //   res.status(response.status);
            //   res.send();
            // }
          }
        } catch (error: any) {
          console.log('error:');
          console.log(error);
          /* istanbul ignore next */
          res.status(500).json({ message: error.message });
        }
      }
    }
  );
}
