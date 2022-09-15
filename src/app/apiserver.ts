import express from 'express';
import mongoose from 'mongoose';
import expressOasGenerator, { SPEC_OUTPUT_FILE_BEHAVIOR } from 'express-oas-generator';
import Models from './models';
import * as DocumentTypes from './models/interfaces';
const cors = require('cors');

import { APIOptions } from '../config/interfaces';
import { initAuth } from './middleware/auth';
const passport = require('passport');
const bcrypt = require('bcryptjs');

export class APIServer {
  app: express.Express;

  options: APIOptions;

  models: Models;

  constructor(options: APIOptions, models: Models) {
    this.app = express();
    this.models = models;
    this.options = options;
  }

  init = () => {
    this.app.use(express.json({ limit: this.options.server.jsonParserLimit }));
    this.app.use(cors());
  };

  addAuth = () => {
    initAuth(this.models, this.options);
    this.app.use(passport.initialize());
  };

  start = () => {
    this.app.listen(this.options.server.port, () => {
      console.log(
        `Server at ${this.options.server.baseRoute} listening on port ${this.options.server.port}.`
      );
    });
  };

  connectDb = async () => {
    await mongoose.connect(
      `${this.options.database.url}${this.options.database.db}?authSource=admin`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      }
    );
  };

  attachRouter = (router: express.Router) => {
    this.app.use(router);
  };

  handleOasRequests = () => {
    expressOasGenerator.handleRequests();
  };

  handleOasResponses = () => {
    expressOasGenerator.handleResponses(this.app, {
      specOutputPath: this.options.docs.oasFile,
      mongooseModels: mongoose.modelNames(),
      specOutputFileBehavior: SPEC_OUTPUT_FILE_BEHAVIOR.PRESERVE,
      swaggerDocumentOptions: {},
      ignoredNodeEnvironments: ['production'],
      swaggerUiServePath: this.options.docs.swaggerUiServePath,
    });
  };

  createDefaultUser = async (defaultUser: DocumentTypes.User) => {
    const count = await this.models.User.countDocuments();
    /* istanbul ignore else */
    if (count === 0 && defaultUser.password) {
      bcrypt
        .hash(defaultUser.password, 10)
        .then((hash: string) => {
          defaultUser.password = hash;
          this.models.User.create(defaultUser)
            .then(() => console.log('Default user created.'))
            .catch(/* istanbul ignore next */ (error) => console.log(error));
        })

        .catch(/* istanbul ignore next */ (err: Error) => console.log(err));
    }
  };
}
