import { readFile } from 'fs/promises';
import pg from 'pg';
import { makeSlug } from './utils';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

const { DATABASE_URL: connectionString, NODE_ENV: nodeEnv = 'development' } =
  process.env;

if (!connectionString) {
  console.error('vantar DATABASE_URL í .env');
  process.exit(-1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development
// mode, á heroku, ekki á local vél
const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    if (nodeEnv !== 'test') {
      console.error('unable to query', e);
    }
    return null;
  } finally {
    client.release();
  }
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}

export async function end() {
  await pool.end();
}

/* TODO útfæra aðgeðir á móti gagnagrunni */

export async function createEvent({ name, description }) {
  const q = `
    INSERT INTO
      events(name, slug, description)
    VALUES
      ($1, $2, $3)
    RETURNING *`;
  const values = [name, makeSlug(name), description];

  const result = await query(q, values);

  return result !== null;
}


export const postEvent = async (req, res) => {
  const { name, description } = req.body;

  const created = await createEvent({ name, description })

  if (created) {
    return res.send('<p>Atburður er skráður</p>');
  }

  return res.render('event', {
    title: 'Atburðurinn minn',
    errors: [{param: '', msg: 'Gat ekki búið til event'}],
    data: { name, description },
  });
};
