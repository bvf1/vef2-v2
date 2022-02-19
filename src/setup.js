import { createEvent, createSchema, dropSchema } from "./lib/db.js";

async function create() {
  // TODO setja upp gagnagrun + gögn
  await dropSchema();
  await createSchema();

  await createEvent({name: 'Forritarahittingur í februar',
  description: 'Forritarar hittast í febrúar og forrita saman eitthvað frábært.'});

  await createEvent({name: 'Hönnunarhittingur í mars',
  description: 'Spennandi hittingur hönnuða í Hönnunarmars'});

  await createEvent({name: 'Verkstjórahittingur í apríl',
  description: 'Virkilega vel verkefnastýriður hittingur'});


}

create().catch((err) => {
  console.error('Error creating running setup', err);
});
