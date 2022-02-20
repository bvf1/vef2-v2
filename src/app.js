import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isInvalid } from './lib/template-helpers.js';

import { router as registrationRouter } from './routes/index-routes.js';
import { router as adminRoute } from './routes/admin-routes.js';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));

const {
  HOST: hostname = '127.0.0.1',
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret = 'alæskdjfæalskdjfælaksjdf',
  DATABASE_URL: databaseUrl,
} = process.env;


if (!sessionSecret || !databaseUrl) {
  console.error('Vantar .env gildi');
  process.exit(1);
}

const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));
app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    maxAge: 20 * 1000, // 20 sek
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.locals.isInvalid = isInvalid;


app.use('/admin', adminRoute);
app.use('/', registrationRouter);

/**
 * Middleware sem sér um 404 villur.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function notFoundHandler(req, res, next) {
  const title = 'Síða fannst ekki';
  res.status(404).render('error', { title });
}

/**
 * Middleware sem sér um villumeðhöndlun.
 *
 * @param {object} err Villa sem kom upp
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const title = 'Villa kom upp';
  res.status(500).render('error', { title });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
