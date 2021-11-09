import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import express, { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import restify from 'express-restify-mongoose';
import * as DocumentTypes from '../models/interfaces';
import { APIOptions } from '../../config/interfaces';
import passport from 'passport';

export function initialize(
  userModel: mongoose.Model<DocumentTypes.User>,
  router: express.Router,
  options: APIOptions
) {
  restify.serve(router, userModel, {
    name: 'users',
    prefix: options.server.prefix,
    version: options.server.version,
    preMiddleware: passport.authenticate('jwt'),
    // disable user creation, except for admins
    preCreate: (req: any, _: express.Response, next: NextFunction) => {
      if (req.user.isAdmin) {
        return next();
      }

      return next({
        statusCode: 403,
        message: 'Only admins can create new user profiles using the users API',
      });
    },

    // disable user modification, except for admins and the user itself
    preUpdate: (req: any, _: express.Response, next: NextFunction) => {
      // extract requested user from request
      const document = <DocumentTypes.User>req.erm.document;

      // only admins can make a change to the isAdmin flag
      if (req.body.isAdmin && !req.user.isAdmin) {
        return next({
          statusCode: 403,
          message: 'Only admins can change the isAdmin flag of a user',
        });
      }

      // allow update for user and admins
      if (req.user.isAdmin || req.user._id.equals(document._id)) {
        return next();
      }

      // disable for everybody else
      return next({
        statusCode: 403,
        message: 'Only admins or the user itself can update user properties',
      });
    },

    // disable user deletion, except for admins
    preDelete: (req: any, res: express.Response, next: NextFunction) => {
      // allow delete for user iteself and admins
      if (req.user.isAdmin) {
        return next();
      }

      // disable for everybody else
      return next({
        statusCode: 403,
        message: 'Only admins can delete a user profile',
      });
    },
  });

  router.post(
    `${options.server.prefix}${options.server.version}/register`,
    async (req: express.Request, res: express.Response) => {
      // Our register logic starts here
      try {
        // Get user input
        const { fullname, email, password } = req.body;

        userModel.validate(req.body).catch((err) => {
          if (err) res.status(400).json({ message: err });
        });

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await userModel.findOne({ email });

        if (oldUser) {
          return res.status(409).json({ message: 'User Already Exist. Please Login' });
        }

        // Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await userModel.create({
          fullname,
          email: email.toLowerCase(), // sanitize: convert email to lowercase
          password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.JWT_SECRET || options.auth.jwt.secret,
          {
            expiresIn: options.auth.jwt.maxAge,
          }
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json(user);
      } catch (err) {
        console.log(err);
      }
    }
  );

  router.post(
    `${options.server.prefix}${options.server.version}/login`,
    async (req: express.Request, res: express.Response) => {
      try {
        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if (!(email && password)) {
          res.status(400).json({ message: 'Missing email or password.' });
        }
        // Validate if user exist in our database
        const user = await userModel.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
          // Create token
          const token = jwt.sign(
            { user_id: user._id, email },
            process.env.JWT_SECRET || options.auth.jwt.secret,
            {
              expiresIn: options.auth.jwt.maxAge,
            }
          );

          // save user token
          user.token = token;

          // user
          res.status(200).json(user);
        }
        res.status(400).json({ message: 'Invalid Credentials' });
      } catch (err) {
        console.log(err);
      }
    }
  );
}
