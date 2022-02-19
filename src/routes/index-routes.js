import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { catchErrors } from '../lib/catch-errors.js';
import {
  chosenEvent,
  createRegistration,
  getEventID,
  listEvents,
  listRegistrations
} from '../lib/db.js';


export const router = express.Router();


async function indexRoute(req, res) {
  res.redirect('/events');

}



async function showEvents(req, res) {
  const events = await listEvents();
  res.render('index', {
    title: 'Viðburðasíðan',
    events,
  });
}
router.get('/', catchErrors(indexRoute));
router.get('/events', catchErrors(showEvents));




async function slugRoute(req, res) {
console.log('slugroute');
  const {slug} = req.params;
  const registrations = await listRegistrations();
  const event = await chosenEvent(slug);
  console.log(`/${slug}`);
  const eventID = event.id;

  res.render('event', {
    title: slug,
    errors: [],
    data: {eventID, slug},
    event,
    registrations,
  });
}

async function slugRoutePost(req, res) {

  const { eventID, slug, name, comment } = req.body;
  const created = await createRegistration({ name, comment, eventID });
   if (created) {
     return res.redirect(`/event/${slug}`);
  }

  return res.render('event', {
    title: 'Skráningin mín',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, comment },
  });
}



router.get('/event/:slug', catchErrors(slugRoute));

router.post('/event/:slug', catchErrors(slugRoutePost));


async function postRegistration (req, res) {
  const { name, comment } = req.body;
  const eventID = await getEventID(req.params.slug);

  const registration = await createRegistration({ name, comment, eventID });
  if (registration) {
    return res.redirect('/:slug');
  }

  return res.render('event', {
    title: 'Skráningin mín',
    errors: [{ param: '', msg: 'Gat skráð á atburðinn' }],
    data: { name, registration },
  });
};

const validationMiddleware = [
  body('name').isLength({ min: 1 }).withMessage('Nafn má ekki vera tómt'),
  body('name').not().equals('admin').withMessage('Nafn má ekki admin'),
  body('name').not().equals('Admin').withMessage('Nafn má ekki Admin'),

];


const xssSanitizationMiddleware = [
  body('name').customSanitizer((value) => xss(value)),
  body('event').customSanitizer((value) => xss(value)),
]

const sanitizationMiddleware = [
  body('name').trim().escape(),
  body('event').trim().escape(),
];

async function validationCheck(req, res, next) {

  const { name = '', description = '',  eventid} = req.body;

  const validation = validationResult(req);
  const events = await listRegistrations();
  if (!validation.isEmpty()) {
    return res.render('', {
      title: 'Skráningin mín',
      errors: validation.errors,
      events,
      data: { name, description, eventid },
    });
  }
  return next();
}

router.post(
  '/',
  validationMiddleware,
  xssSanitizationMiddleware,
  catchErrors(validationCheck),
  sanitizationMiddleware,
  catchErrors(postRegistration),
);



/*


app.post('/admin', validation, validationResults, sanitazion, catchErrors(postEvent));

//router.get('/events', catchErrors(eventRoute));

//router.get('/:slug', catchErrors(slugRoute));

////router.get('/event/:slug', catchErrors(slugRoute));
//router.post('/event:slug/post', catchErrors(slugPostRoute));

// TODO útfæra öll routes


const validation = [
  body('name').isLength({ min: 1 }).withMessage('Nafn má ekki vera tómt'),
];

const sanitazion = [
  body('name').trim().escape(),
  body('name').customSanitizer((value) => xss(value)),
  body('event').trim().escape(),
  body('event').customSanitizer((value) => xss(value)),
];

const validationResults = async (req, res, next) => {
  const { name = '', description = '' } = req.body;

  const result = validationResult(req);
  const events = await listEvents();
  if (!result.isEmpty()) {
    return res.render('admin', {
      title: 'Atburðurinn minn',
      errors: result.errors,
      events,
      data: { name, description },
    });
  }

  return next();
};
/*
const postEvent = async (req, res) => {
  console.log('postevent');
  const { name, description } = req.body;

  const created = await createEvent({ name, description });
  if (created) {
    console.log(created);
    return res.redirect('/admin');
  }

  const events = await listEvents();
  return res.render('admin', {
    title: 'Atburðurinn minn',
    errors: [{ param: '', msg: 'Atburður er nú þegar til' }],
    data: { name, description },
    events,
  });
};

router.post('/admin', validation, validationResults, sanitazion, postEvent);

const postRegistration = async (req, res) => {
  const { name, comment } = req.body;
  const eventID = await getEventID(req.params.slug);

  const registration = await createRegistration({ name, comment, eventID });
  /* if (registration) {
    return res.redirect('/:slug');
  }

  return res.render('event', {
    title: 'Skráningin mín',
    errors: [{ param: '', msg: 'Gat ekki búið til event' }],
    data: { name, registration },
  });
};

router.post('/:slug', validation, validationResults, sanitazion, postRegistration);


*/
