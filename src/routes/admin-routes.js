import express from 'express';
import passport from 'passport';
import { listEvents, chosenEvent, updateEvent } from '../lib/db.js';

export const router = express.Router();

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('next');
    return next();
  }
  console.log('redirect  in /admin');
  return res.redirect('/admin/login');
}

router.get('/', ensureLoggedIn, async (req, res) => {
  // ensureLoggedIn
  const events = await listEvents();
  res.render('admin', { title: 'admin svæði', events, errors: [], data: {} });
});

router.get('/login', (req, res) => {
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

  return res.send(`
    <form method="post" action="/admin/login">
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
    failureRedirect: '/admin/login',
  }),
  (req, res) => {
    res.redirect('/admin/login');
  }
);

router.get('/:slug', async (req, res) => {
  const { name, description } = await chosenEvent(req.params.slug);
  res.render('admin-event', {
    title: 'admin svæði',
    errors: [],
    data: { name, description },
  });
});

router.post('/:slug', async (req, res) => {
  const { name, description } = req.body;
  const slug = req.params.slug;
  console.log(object);
  console.log(name); /*
 // const event = await updateEvent({ name, description, slug });
  if (event) {
    return res.redirect('/');
  }

  return res.render('/admin-event', {
    title: 'Atburðurinn minn',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, description},
  });*/
});

//console.log(req.originalUrl);
