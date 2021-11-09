import express from 'express';
import Models from '../models';
import * as papers from './papers';
import * as affiliations from './affiliations';
import * as venues from './venues';
import * as authors from './authors';
import * as users from './users';
import { APIOptions } from '../../config/interfaces';

export class Controllers {
  static initialize(
    models: Models,
    router: express.Application | express.Router,
    // authMiddleware: { (req: any, res: express.Response, next: NextFunction): void },
    options: APIOptions
  ) {
    affiliations.initialize(models.Affiliation, router, options);
    authors.initialize(models.Author, router, options);
    papers.initialize(models.Paper, router, options);
    venues.initialize(models.Venue, router, options);
    users.initialize(models.User, router, options);
  }
}
