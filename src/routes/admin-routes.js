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
  <!doctype html>
<html lang="is">

<head>
  <meta charset="utf-8">
  <title>Login</title>
  <link rel="stylesheet" href="/styles.css">
</head>

<body class="flex-container">
      <h1>Innskráning</h1>
    <div">
      <form  class="login method="post" action="/admin/login">
        <label>Notendanafn: </label> <input type="text" name="username"></input>
        <label>Lykilorð: </label> <input type="password" name="password"></input>
        <button>Innskrá</button>
      </form>
      <p>${message}</p>
    </div>
    <div class="tilbaka">
      <a href="/">Til Baka</a>
    </div>
    </body>

    </html>
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
