import express, { NextFunction } from 'express';
import restify from 'express-restify-mongoose';
import mongoose from 'mongoose';
import { APIOptions } from '../../config/interfaces';
import * as DocumentTypes from '../models/interfaces';
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');

export function initialize(
  userModel: mongoose.Model<DocumentTypes.User>,
  router: express.Router,
  options: APIOptions
) {
  restify.serve(router, userModel, {
    name: 'users',
    prefix: options.server.prefix,
    version: options.server.version,
    preMiddleware: passport.authenticate('admin', { session: false }),
    // disable user creation
    preCreate: (_: any, res: express.Response) => {
      return res.status(403).json({
        message: 'Users can only be created using the register API',
      });
    },

    postRead: (req: any, res: express.Response, next: NextFunction) => {
      // allow reading only for admins or the user itself
      if (req.user.isAdmin) {
        return next();
      }
      return res
        .status(200)
        .json(req.erm.result.filter((el: DocumentTypes.User) => el._id.equals(req.user._id)));
    },

    // disable user modification, except for admins and the user itself
    preUpdate: (req: any, res: express.Response, next: NextFunction) => {
      // only admins can make a change to the isAdmin flag
      if (req.body.isAdmin && !req.user.isAdmin) {
        return res.status(403).json({
          message: 'Only admins can change the isAdmin flag of a user',
        });
      }

      // allow update for user and admins
      /* istanbul ignore else */
      if (req.user.isAdmin || req.user._id.equals(req.params.id)) {
        return next();
      }

      // disable for everybody else
      return res.status(403).json({
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
      return res.status(403).json({
        message: 'Only admins can delete a user profile',
      });
    },
  });

  router.post(
    `${options.server.baseRoute}/register`,
    async (req: express.Request, res: express.Response, next: NextFunction) => {
      // Our register logic starts here
      try {
        // Get user input
        const { fullname, email, password } = req.body;

        userModel.validate(req.body).catch((err) => {
          /* istanbul ignore else */
          if (err) res.status(400).json({ message: err });
        });

        // check if user already exist
        const oldUser = await userModel.findOne({ email });

        if (oldUser) {
          return res.status(409).json({ message: 'User already exist. Please login.' });
        }

        // Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await userModel.create({
          fullname,
          email: email.toLowerCase(),
          password: encryptedPassword,
          isAdmin: false,
          isActive: false,
        });

        user.isAdmin = undefined;
        user.isActive = undefined;

        // return new user
        res.status(201).json(user);
      } catch (err) {
        /* istanbul ignore next */
        return next(err);
      }
    }
  );

  router.post(`${options.server.baseRoute}/login`, async (req: any, res, next) => {
    passport.authenticate('login', async (err: Error | boolean, user: DocumentTypes.User) => {
      try {
        if (err || !user) {
          res.status(400).json({ message: 'Wrong email or password.' });
        } else {
          req.login(user, { session: false }, async (error: Error) => {
            /* istanbul ignore next */
            if (error) return next(error);

            const body = { _id: user._id, email: user.email };
            const token = jwt.sign({ user: body }, options.auth.jwt.secret);

            return res.json({ token });
          });
        }
      } catch (error) {
        /* istanbul ignore next */
        return next(error);
      }
    })(req, res, next);
  });
}
