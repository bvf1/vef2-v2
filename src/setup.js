import { query } from 'express';

async function create() {
  console.log('object');
  const q = `
    UPDATE events
    SET name = $1,
      slug = $1,
      description = $2,
    WHERE slug = $3`;
  const values = ['as', 'asasssa', 'asdf'];

  const result = await query(q, values);
  console.log(result);

  // return result !== null;

  let a = `
  UPDATE events
  SET name = 'bb',
    slug = 'bb',
    description = 'asasas'
  WHERE slug = 'as';


   ``

  select name from events;

  `;
}

create().catch((err) => {
  console.error('Error creating running setup', err);
});
