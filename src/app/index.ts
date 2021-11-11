import express from 'express';
import { Controllers } from './controllers';
import Models from './models';
import { APIOptions } from '../config/interfaces';
import { APIServer } from './apiserver';
import * as DocumentTypes from './models/interfaces';

export async function initServer(options: APIOptions): Promise<APIServer> {
  // Initialize models
  const models = new Models();

  // Create a basic server instance
  const app = new APIServer(options, models);

  // Initialize automatic oas for responses
  app.handleOasResponses();

  // Initialize standard app config
  app.init();

  // Add auth middleware
  app.addAuth();

  // Establish mongodb connection
  await app.connectDb();

  // Initialize controller and link them into the router, then into the server
  const router = express.Router();

  // Initialize controllers with models and router
  Controllers.initialize(models, router, options);

  // Attach router to the server
  app.attachRouter(router);

  // check for existing users in the db, if none is found, create default user
  await app.createDefaultUser(<DocumentTypes.User>options.user.default);

  // Initialize automatic oas for requests
  app.handleOasRequests();

  // Start the server
  app.start();

  return app;
}
