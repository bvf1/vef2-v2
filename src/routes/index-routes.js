import express from 'express';
import { catchErrors } from '../lib/catch-errors.js';
import {
  chosenEvent,
  createRegistration,
  getEventID,
  listEvents,
  listRegistrations,
} from '../lib/db.js';

export const indexRouter = express.Router();

async function indexRoute(req, res) {
  const events = await listEvents();

  res.render('index', {
    title: 'Viðburðasíðan',
    events,
  });
}

async function slugRoute(req, res) {
  const {slug} = req.params;

  const event = await chosenEvent(slug);
  const registrations = await listRegistrations();
  console.log("slugroute");
  console.log(req.originalUrl);
  res.render('event', {
    title: slug,
    errors: [],
    data: { slug },
    event,
    registrations,
  });
}

async function slugPostRoute(req, res) {
  console.log('slugpostrout');
  console.log(req.params.slug);
  const { name, comment } = req.body;
  console.log('lol');

  const eventID = await getEventID(req.params.slug);
  console.log('lol');

  const registration = await createRegistration({ name, comment, eventID });
  console.log('lol');
  if (registration) {
    return res.send('<p>Notandi er skráður í viðburð</p>');
  }
  /*
  return res.render('event', {
    title: 'Skráningin mín',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, registration },
  }); */
  return null;
}

indexRouter.get('/', catchErrors(indexRoute));

indexRouter.get('/:slug', catchErrors(slugRoute));
indexRouter.post('/:slug/post', catchErrors(slugPostRoute));

// TODO útfæra öll routes
