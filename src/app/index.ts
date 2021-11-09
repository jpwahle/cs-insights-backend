import express from 'express';
import { Controllers } from './controllers';
import Models from './models';
import { APIOptions } from '../config/interfaces';
import { APIServer } from './apiserver';
import * as DocumentTypes from './models/interfaces';
// import { createAuthMiddleware } from './middleware/auth';

export function initServer(options: APIOptions): APIServer {
  // Initialize models
  const models = new Models();

  // Create a basic server instance
  const app = new APIServer(options);

  // Initialize automatic oas for responses
  app.handleOasResponses();

  // Initialize standard app config
  app.init();

  // Add auth middleware
  app.addAuth(models);

  // Initialize automatic oas for requests
  app.handleOasRequests();

  // Establish mongodb connection
  app.connectDb();

  // Initialize controller and link them into the router, then into the server
  const router = express.Router();

  // Initialize auth middleware
  // const authMiddleware = createAuthMiddleware(options);

  // Initialize controllers with models and router
  Controllers.initialize(models, router, options);

  // Attach router to the server
  app.attachRouter(router);

  // Attach documentation endpoint
  app.attachDocs();

  // check for existing users in the db, if none is found, create default user
  app.createDefaultUser(<DocumentTypes.User>options.user.default, models);

  // Start the server
  app.start();

  return app;
}
