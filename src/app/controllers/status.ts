import express from 'express';
import { LIB_VERSION } from '../../version';

import { APIOptions } from '../../config/interfaces';
import { QueryFilters } from '../../types';

export function initialize(router: express.Router, options: APIOptions) {
  // authors endpoint
  const route = `${options.server.baseRoute}`;

  router.get(
    route + '/status',
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      try {
        res.status(200).json({ version: LIB_VERSION, status: 'OK' });
      } catch (error: any) {
        /* istanbul ignore next */
        res.status(500).json({ version: LIB_VERSION, status: error.message });
      }
    }
  );
}
