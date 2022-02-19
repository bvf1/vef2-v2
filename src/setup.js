import {
  createEvent,
  createRegistration,
  createSchema,
  dropSchema,
} from './lib/db.js';

async function create() {
  // TODO setja upp gagnagrun + gögn
  await dropSchema();
  await createSchema();

  await createEvent({
    name: 'Forritarahittingur í februar',
    description:
      'Forritarar hittast í febrúar og forrita saman eitthvað frábært.',
  });

  await createEvent({
    name: 'Hönnunarhittingur í mars',
    description: 'Spennandi hittingur hönnuða í Hönnunarmars',
  });

  await createEvent({
    name: 'Verkstjórahittingur í apríl',
    description: 'Virkilega vel verkefnastýriður hittingur',
  });

  await createRegistration({
    name: 'Forvitinn forritari',
    comment: 'Hlakka til að forrita með ykkur',
    eventID: 1,
  });
  await createRegistration({
    name: 'Jón Jónsson',
    comment: '',
    eventID: 1,
  });
  await createRegistration({
    name: 'Guðrún Gúðrúnar',
    comment: 'Verður vefforitað',
    eventID: 1,
  });

  await createRegistration({
    name: 'a rabit walks into a bar and asks for carror juice',
    comment: 'he he',
    eventID: 3,
  });
}

create().catch((err) => {
  console.error('Error creating running setup', err);
});
