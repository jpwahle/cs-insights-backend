import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import cors from 'cors';
import redoc from 'redoc-express';
import expressOasGenerator, { SPEC_OUTPUT_FILE_BEHAVIOR } from 'express-oas-generator';
import Models from './models';
import * as DocumentTypes from './models/interfaces';

import { APIOptions } from '../config/interfaces';
import passport from 'passport';
import { initAuth } from './middleware/auth';
import session from 'express-session';

export class APIServer {
  app: express.Express;

  options: APIOptions;

  swaggerDocGen: any;

  constructor(options: APIOptions) {
    this.app = express();
    this.options = options;
  }

  init = () => {
    this.app.use(express.json());
    this.app.use(cors());
  };

  addAuth = (models: Models) => {
    this.app.use(
      session({ secret: this.options.auth.session.secret, resave: true, saveUninitialized: true })
    );
    initAuth(models, this.options);
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  };

  start = () => {
    this.app.listen(this.options.server.port, () => {
      console.log(`Server listening on port ${this.options.server.port}.`);
    });
  };

  connectDb = () => {
    mongoose
      .connect(this.options.database.url, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log(`Connected to mongodb.`))
      .catch((err) => console.log(err));
  };

  attachRouter = (router: express.Router) => {
    this.app.use(router);
  };

  attachDocs = () => {
    this.app.get(
      this.options.docs.redocUiServePath,
      redoc({
        title: this.options.docs.title,
        specUrl: '/api-spec/v3',
      })
    );
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

  createDefaultUser = (defaultUser: DocumentTypes.User, models: Models) => {
    models.User.countDocuments()
      .then((count) => {
        if (count === 0) {
          bcrypt
            .hash(defaultUser.password, 10)
            .then((hash) => {
              defaultUser.password = hash;
              models.User.create(defaultUser)
                .then(() => console.log('Default user created.'))
                .catch((error) => console.log(error));
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => console.log(err));
  };
}
