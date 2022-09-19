import express from 'express';
import { APIOptions } from '../../config/interfaces';
import Models from '../models';
import * as authors from './authors';
import * as papers from './papers';
import * as status from './status';
import * as topics from './topics';
import * as users from './users';

export class Controllers {
  static initialize(models: Models, router: express.Router, options: APIOptions) {
    authors.initialize(models.Author, router, options);
    papers.initialize(models.Paper, router, options);
    users.initialize(models.User, router, options);
    topics.initialize(models.Paper, router, options);
    status.initialize(router, options);
  }
}

export function addCreated(req: any) {
  if (Array.isArray(req.body)) {
    for (const i in req.body) {
      req.body[i].createdBy = req.user._id;
      req.body[i].createdAt = new Date();
    }
  } else {
    req.body.createdBy = req.user._id;
    req.body.createdAt = new Date();
  }
}
