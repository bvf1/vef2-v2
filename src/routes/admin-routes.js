import express from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import xss from 'xss';
import { catchErrors } from '../lib/catch-errors.js';
import {
  listEvents,
  chosenEvent,
  updateEvent,
  createEvent,
} from '../lib/db.js';
import { ensureLoggedIn } from '../login.js';

export const router = express.Router();

async function index(req, res) {
  const events = await listEvents();
  res.render('admin', { title: 'admin svæði', events, errors: [], data: {} });
}

async function slugRoute(req, res) {
  const { name, description } = await chosenEvent(req.params.slug);
  res.render('admin-event', {
    title: 'admin svæði',
    errors: [],
    data: { name, description },
  });
}

async function slugRoutePost(req, res) {
  const { name, description } = req.body;

  const event = await updateEvent({ name, description });
  if (event) {
    return res.redirect('/');
  }

  return res.render('admin-event', {
    title: 'Atburðurinn minn',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, description },
  });
}

async function postEvent(req, res) {
  const { name, description } = req.body;

  const created = await createEvent({ name, description });
  if (created) {
    return res.redirect('/admin');
  }
  const events = await listEvents();
  return res.render('admin', {
    title: 'Atburðurinn minn',
    errors: [{ param: '', msg: 'Atburður er nú þegar til' }],
    data: { name, description },
    events,
  });
}
function login(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er
  //  birtum þau og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message, title: 'Innskráning' });
}

router.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),
  (req, res) => {
    res.redirect('/admin');
  }
);

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

const validationMiddleware = [
  body('name').isLength({ min: 1 }).withMessage('Nafn má ekki vera tómt'),
  body('name').not().equals('admin').withMessage('Nafn má ekki admin'),
  body('name').not().equals('Admin').withMessage('Nafn má ekki Admin'),
];

const xssSanitizationMiddleware = [
  body('name').customSanitizer((value) => xss(value)),
  body('event').customSanitizer((value) => xss(value)),
];

const sanitizationMiddleware = [
  body('name').trim().escape(),
  body('event').trim().escape(),
];

async function validationCheck(req, res, next) {
  const { name = '', description = '' } = req.body;

  const validation = validationResult(req);
  const events = await listEvents();
  if (!validation.isEmpty()) {
    return res.render('', {
      title: 'Atburðurinn minn',
      errors: validation.errors,
      events,
      data: { name, description },
    });
  }
  return next();
}

router.get('/', ensureLoggedIn, catchErrors(index));
router.post('/', catchErrors(postEvent));

router.get('/login', login);
router.get('/:slug', catchErrors(slugRoute));
router.post('/:slug', catchErrors(slugRoutePost));
router.post(
  '/',
  validationMiddleware,
  xssSanitizationMiddleware,
  catchErrors(validationCheck),
  sanitizationMiddleware,
  catchErrors(postEvent)
);
