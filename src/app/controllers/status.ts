import express from 'express';
import { version } from '../../../package.json';

import { APIOptions } from '../../config/interfaces';
import { QueryFilters } from '../../types';

export function initialize(router: express.Router, options: APIOptions) {
  // authors endpoint
  const route = `${options.server.baseRoute}`;

  router.get(
    route + '/status',
    async (req: express.Request<{}, {}, {}, QueryFilters>, res: express.Response) => {
      try {
        res.status(200).json({ version, status: 'OK' });
      } catch (error: any) {
        /* istanbul ignore next */
        res.status(500).json({ version, status: error.message });
      }
    }
  );
}
