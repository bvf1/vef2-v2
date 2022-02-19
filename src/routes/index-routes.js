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
/*

async function indexRoute(req, res) {
  res.redirect('/events');

}
*/
async function indexRoute(req, res) {
  const events = await listEvents();

  res.render('index', {
    title: 'Viðburðasíðan',
    events,
  });
}

/*
async function slugRoute(req, res) {
  console.log(req.originalUrl);
  const { slug } = req.params;

  console.log(slug);
  const event = await chosenEvent(slug);
  //if (event.length === 0) return res.render('error');

  const registrations = await listRegistrations();

  res.render('event', {
    title: slug,
    errors: [],
    data: { slug },
    event,
    registrations,
  });
}

*/
indexRouter.get('/', catchErrors(indexRoute));
//indexRouter.get('/events', catchErrors(eventRoute));

//indexRouter.get('/:slug', catchErrors(slugRoute));

////indexRouter.get('/event/:slug', catchErrors(slugRoute));
//indexRouter.post('/event:slug/post', catchErrors(slugPostRoute));

// TODO útfæra öll routes
