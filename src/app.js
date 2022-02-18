import dotenv from 'dotenv';
import pg from 'pg';
import express from 'express';
import { body, validationResult } from 'express-validator';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// import { isInvalid } from './lib/template-helpers';
import { indexRouter } from './routes/index-routes.js';

dotenv.config();
const app = express();

  // Sér um að req.body innihaldi gögn úr formi
  app.use(express.urlencoded({ extended: true }));

const {
  PORT: port = 3000,
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'developement'
} = process.env;

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
  body('name').isLength({ min: 1 }).withMessage('Nafn má ekki vera tómt')
]

const validationResults = (req, res, next) => {
  const { name = '', description = ''} = req.body;

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


app.post('/post',validation, validationResults, postEvent);


app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
