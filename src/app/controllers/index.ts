import express from 'express';
import Models from '../models';
import * as papers from './papers';
import * as papersFE from './frontend/papers';
import * as affiliations from './affiliations';
import * as venues from './venues';
import * as venuesFE from './frontend/venues';
import * as authors from './authors';
import * as authorsFE from './frontend/authors';
import * as fieldsOfStudyFE from './frontend/fieldsOfStudy';
import * as typesOfPaperFE from './frontend/typesOfPaper';
import * as publishersFE from './frontend/publishers';
import * as citationsFE from './frontend/citations';
import * as topicsFE from './frontend/topics';
import * as users from './users';
import { APIOptions } from '../../config/interfaces';

export class Controllers {
  static initialize(models: Models, router: express.Router, options: APIOptions) {
    affiliations.initialize(models.Affiliation, router, options);
    authors.initialize(models.Author, router, options);
    papers.initialize(models.Paper, router, options);
    venues.initialize(models.Venue, router, options);
    users.initialize(models.User, router, options);

    authorsFE.initialize(models.Paper, models.Author, router, options);
    papersFE.initialize(models.Paper, router, options);
    venuesFE.initialize(models.Paper, models.Venue, router, options);
    typesOfPaperFE.initialize(models.Paper, router, options);
    fieldsOfStudyFE.initialize(models.Paper, router, options);
    publishersFE.initialize(models.Paper, router, options);
    citationsFE.initialize(models.Paper, router, options);
    topicsFE.initialize(models.Paper, router, options);
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
