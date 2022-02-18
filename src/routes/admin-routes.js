import express from 'express';
import passport from 'passport';
import { listEvents, chosenEvent, updateEvent } from '../lib/db.js';

export const router = express.Router();

export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

router.get('/',ensureLoggedIn, async (req, res) => {
  // ensureLoggedIn
  const events = await listEvents();
  res.render('admin', { title: 'admin svæði', events, errors: [], data: {} });
});

router.get('/login', (req, res) => {
  console.log("eror");

  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er
  //  birtum þau og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.send(`
    <form method="post" action="/login">
      <label>Notendanafn: <input type="text" name="username"></label>
      <label>Lykilorð: <input type="password" name="password"></label>
      <button>Innskrá</button>
    </form>
    <p>${message}</p>
  `);
});

router.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),
  (req, res) => {
    console.log(req.originalUrl);

    res.redirect('/admin');
  }
);

router.get('/:slug', async (req, res) => {
  const { name, description, slug } = await chosenEvent(req.params.slug);

  res.render('admin-event', {
    title: 'admin svæði',
    errors: [],
    data: { name, description, slug },
  });
});

router.post('/:slug/post', async (req, res) => {
  const { name, description } = req.body;
  const event = await updateEvent({ name, description });
  if (event) {
    return res.send('<p>Atburði er breytt</p>');
  }

  return res.render('/admin-event', {
    title: 'Atburðurinn minn',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, description },
  });
});
