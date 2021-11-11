import Models from '../models';
import { APIOptions } from '../../config/interfaces';
const passportLocal = require('passport-local');
const passportJwt = require('passport-jwt');
const passport = require('passport');
const bcrypt = require('bcryptjs');

export function initAuth(models: Models, options: APIOptions) {
  passport.use(
    'login',
    new passportLocal.Strategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email: string, password: string, done: any) => {
        try {
          const user = await models.User.findOne({ email }).select('+password');

          if (!user) {
            return done(null, false, { message: 'User not found' });
          }
          if (
            /* istanbul ignore next */ user &&
            user.password &&
            (await bcrypt.compare(password, user.password))
          ) {
            return done(null, user, { message: 'Logged in successfully' });
          }
          return done(null, false, { message: 'Wrong password' });
        } catch (error) {
          /* istanbul ignore next */
          return done(error);
        }
      }
    )
  );
  passport.use(
    new passportJwt.Strategy(
      {
        jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
        secretOrKey: options.auth.jwt.secret,
      },
      (jwtToken: any, done: any) => {
        models.User.findOne({ _id: jwtToken.user._id })
          .select('+isAdmin +isActive')
          .exec((err, user) => {
            /* istanbul ignore if */
            if (err) {
              return done(err, false);
            }
            /* istanbul ignore else */
            if (user) {
              return done(undefined, user, jwtToken);
            } else {
              return done(undefined, false);
            }
          });
      }
    )
  );
}
