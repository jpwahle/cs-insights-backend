import { APIOptions } from '../../config/interfaces';
import passport from 'passport';
import passportJwt from 'passport-jwt';
import * as DocumentTypes from '../models/interfaces';
import Models from '../models';

export function initAuth(models: Models, options: APIOptions) {
  passport.use(
    new passportJwt.Strategy(
      {
        jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
        secretOrKey: options.auth.jwt.secret,
      },
      (jwtToken, done) => {
        models.User.findOne(
          { username: jwtToken.username },
          (err: Error, user: DocumentTypes.User) => {
            if (err) {
              return done(err, false);
            }
            if (user) {
              return done(undefined, user, jwtToken);
            } else {
              return done(undefined, false);
            }
          }
        );
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, JSON.stringify(user));
  });

  passport.deserializeUser((user: string, done) => {
    done(null, JSON.parse(user));
  });
}
