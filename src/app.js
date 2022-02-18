import dotenv from 'dotenv';
import pg from 'pg';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import { Strategy } from 'passport-local';

import { body, validationResult } from 'express-validator';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// import { isInvalid } from './lib/template-helpers';
import xss from 'xss';
import { indexRouter } from './routes/index-routes.js';

import { comparePasswords, findByUsername, findById } from './lib/users.js';
import { router as adminRouter } from './routes/admin-routes.js';
import { createEvent, createRegistration } from './lib/db.js';

dotenv.config();
const app = express();

// Sér um að req.body innihaldi gögn úr formi
app.use(express.urlencoded({ extended: true }));

const {
  PORT: port = 3000,
  DATABASE_URL: connectionString,
  SESSION_SECRET: sessionSecret = 'jfowijfowijfew ',
  DATABASE_URL: databaseUrl,
  NODE_ENV: nodeEnv = 'developement',
} = process.env;

if (!sessionSecret || !databaseUrl) {
  console.error('Vantar .env gildi');
  process.exit(1);
}
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development
// mode, á heroku, ekki á local vél
const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('postgres error, exiting...', err);
  process.exit(-1);
});

const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));
app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');

async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    // Verður annað hvort notanda hlutur ef lykilorð rétt, eða false
    const result = await comparePasswords(password, user.password);

    return done(null, result ? user : false);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}
passport.use(
  new Strategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    strat
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/admin', adminRouter);

app.use('/', indexRouter);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Heiti á reit í formi
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors = []) {
  // Boolean skilar `true` ef gildi er truthy (eitthvað fannst)
  // eða `false` ef gildi er falsy (ekkert fannst: null)
  return Boolean(errors.find((i) => i && i.param === field));
}

app.locals.isInvalid = isInvalid;

app.get('/', async (req, res) => {
  res.render('event', {
    title: 'Atburðurinn minn',
    errors: [],
    data: {},
  });
});

const validation = [
  body('name').isLength({ min: 1 }).withMessage('Nafn má ekki vera tómt'),
];

const sanitazion = [
  body('name').trim().escape(),
  body('name').customSanitizer((value) => xss(value)),
  body('event').trim().escape(),
  body('event').customSanitizer((value) => xss(value)),
];

const validationResults = (req, res, next) => {
  const { name = '', description = '' } = req.body;

  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.render('event', {
      title: 'Atburðurinn minn',
      errors: result.errors,
      data: { name, description },
    });
  }

  return next();
};

const postEvent = async (req, res) => {
  const { name, description } = req.body;

  const created = await createEvent({ name, description });

  if (created) {
    return res.send('<p>Atburður er skráður</p>');
  }

  return res.render('event', {
    title: 'Atburðurinn minn',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, description },
  });
};

app.post('/post', validation, validationResults, sanitazion, postEvent);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
