import mongoose from 'mongoose';
import express, { NextFunction } from 'express';
import restify from 'express-restify-mongoose';
import * as DocumentTypes from '../models/interfaces';
import { APIOptions } from '../../config/interfaces';
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
    totalCountHeader: true,
    // disable user creation
    preCreate: (_: any, res: express.Response) => {
      return res.status(403).json({
        message: 'Users can only be created using the register API',
      });
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

        userModel.validate(req.body).catch((err: any) => {
          /* istanbul ignore else */
          if (err) res.status(400).json({ message: err });
        });

        // check if user already exist
        const duplicate = await userModel.findOne({ email });

        if (duplicate) {
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

            const foundUser = await userModel.findOne({ email: user.email });

            const body = { _id: user._id, email: user.email };
            const token = jwt.sign({ user: body }, options.auth.jwt.secret, {
              expiresIn: options.auth.jwt.maxTokenAge,
            });
            const newRefreshToken = jwt.sign({ email: user.email }, options.auth.jwt.secret, {
              expiresIn: options.auth.jwt.maxRefreshTokenAge,
            });

            // Changed to let keyword
            let newRefreshTokenArray = !req.cookies?.jwt
              ? foundUser?.refreshToken
              : foundUser?.refreshToken?.filter((rt: string) => rt !== req.cookies?.jwt);

            if (req.cookies?.jwt) {
              /* 
              Scenarios:
                  1) User logs in but never uses RT and does not logout 
                  2) RT is stolen
                  3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
              */
              const refreshToken = req.cookies?.jwt;
              const foundToken = await userModel.findOne({ refreshToken });

              // Detected refresh token reuse!
              if (!foundToken) {
                console.log('attempted refresh token reuse at login!');
                // clear out ALL previous refresh tokens
                newRefreshTokenArray = [];
              }

              res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
            }

            // Saving refreshToken with current user
            if (foundUser) {
              foundUser.refreshToken = [...(newRefreshTokenArray || []), newRefreshToken];
            }

            await userModel.updateOne(
              { _id: foundUser?._id },
              { refreshToken: foundUser?.refreshToken }
            );
            // Creates Secure Cookie with refresh token
            res.cookie('jwt', newRefreshToken, {
              httpOnly: true,
              secure: true,
              sameSite: 'none',
              maxAge: 24 * 60 * 60 * 1000,
            });

            // Send authorization roles and access token to user
            res.json({ token });
          });
        }
      } catch (error) {
        /* istanbul ignore next */
        return next(error);
      }
    })(req, res, next);
  });

  router.get(
    `${options.server.baseRoute}/refreshtoken`,
    async (req: express.Request, res: express.Response, next: NextFunction) => {
      // Our register logic starts here
      try {
        if (!req.cookies?.jwt) return res.sendStatus(401);
        const refreshToken = req.cookies.jwt;
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });

        const foundUser = await userModel.findOne({ refreshToken });

        // Detected refresh token reuse!
        if (!foundUser) {
          jwt.verify(
            refreshToken,
            options.auth.jwt.secret,
            async (err: any, decoded: { _id: string; email: string }) => {
              if (err) return res.sendStatus(403); //Forbidden
              console.log('attempted refresh token reuse!');
              const hackedUser = await userModel.findOne({ email: decoded.email });
              if (hackedUser) {
                hackedUser.refreshToken = [];
              }
              await userModel.updateOne(
                { _id: hackedUser?._id },
                { refreshToken: hackedUser?.refreshToken }
              );
            }
          );
          return res.sendStatus(403); //Forbidden
        }

        const newRefreshTokenArray = foundUser?.refreshToken?.filter(
          (rt: string) => rt !== refreshToken
        );

        jwt.verify(
          refreshToken,
          options.auth.jwt.secret,
          async (err: any, decoded: { _id: string; email: string }) => {
            if (err) {
              console.log('expired refresh token');
              foundUser.refreshToken = [...(newRefreshTokenArray || [])];
              await userModel.updateOne(
                { _id: foundUser?._id },
                { refreshToken: foundUser?.refreshToken }
              );
            }
            if (err || foundUser.email !== decoded.email) return res.sendStatus(403);

            const user = { _id: foundUser._id, email: foundUser.email };
            // Refresh token was still valid
            const token = jwt.sign({ user }, options.auth.jwt.secret, {
              expiresIn: options.auth.jwt.maxTokenAge,
            });

            const newRefreshToken = jwt.sign({ email: user.email }, options.auth.jwt.secret, {
              expiresIn: options.auth.jwt.maxRefreshTokenAge,
            });
            // Saving refreshToken with current user
            foundUser.refreshToken = [...(newRefreshTokenArray || []), newRefreshToken];
            await userModel.updateOne(
              { _id: foundUser._id },
              { refreshToken: foundUser.refreshToken }
            );
            // Creates Secure Cookie with refresh token
            res.cookie('jwt', newRefreshToken, {
              httpOnly: true,
              secure: true,
              sameSite: 'none',
              maxAge: 24 * 60 * 60 * 1000,
            });

            res.json({ token });
          }
        );
      } catch (err) {
        /* istanbul ignore next */
        return next(err);
      }
    }
  );
  router.get(
    `${options.server.baseRoute}/logout`,
    async (req: express.Request, res: express.Response, next: NextFunction) => {
      try {
        // On client, also delete the accessToken
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204); //No content
        const refreshToken = cookies.jwt;

        // Is refreshToken in db?
        const foundUser = await userModel.findOne({ refreshToken }).exec();
        if (!foundUser) {
          res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
          return res.sendStatus(204);
        }

        // Delete refreshToken in db
        foundUser.refreshToken = foundUser?.refreshToken?.filter(
          (rt: string) => rt !== refreshToken
        );
        await foundUser.save();

        res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
        res.sendStatus(204);
      } catch (err) {
        /* istanbul ignore next */
        return next(err);
      }
    }
  );
}
