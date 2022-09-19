import express from 'express';
import { LIB_VERSION } from '../../version';

import { APIOptions } from '../../config/interfaces';

export function initialize(router: express.Router, options: APIOptions) {
  const route = `${options.server.baseRoute}`;

  router.get(route + '/status', async (req: express.Request, res: express.Response) => {
    try {
      res.status(200).json({ version: LIB_VERSION, status: 'OK' });
    } catch (error: any) {
      /* istanbul ignore next */
      res.status(500).json({ version: LIB_VERSION, status: error.message });
    }
  });

  /* istanbul ignore next */
  router.get(
    route + '/statusPredictionBackend',
    async (req: express.Request, res: express.Response) => {
      try {
        //query predictions endpoint
        const url = `http://${process.env.PREDICTION_ENDPOINT_HOST}:${process.env.PREDICTION_ENDPOINT_PORT}/api/v0/status`;
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
        res.status(500).json({ version: LIB_VERSION, status: error.message });
      }
    }
  );
}
