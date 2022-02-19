import { readFile } from 'fs/promises';
import pg from 'pg';
import { makeSlug } from './utils.js';

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

  if (result) {
    return result.rows[0];
  }

  return [];
}

export async function updateEvent({ name, description, slug }) {
  const q = `
    UPDATE events
    SET name = $1,
      slug = $2,
      description = $3,
      updated = current_timestamp
    WHERE slug = $4`;

  const values = [name, makeSlug(name), description, slug];

  const result = await query(q, values);

  if (result) {
    return result.rows[0];
  }

  return [];
}

export async function createRegistration({ name, comment, eventID }) {
  const q = `
    INSERT INTO
      registrations(name, comment, eventID)
    VALUES
      ($1, $2, $3)
    RETURNING *`;
  const values = [name, comment, eventID];

  const result = await query(q, values);

  return result !== null;
}

export async function listEvents() {
  const q = 'SELECT * FROM events';

  const result = await query(q);

  if (result) {
    return result.rows;
  }

  return [];
}

export async function listRegistrations() {
  const q = 'SELECT * FROM registrations';

  const result = await query(q);

  if (result) {
    return result.rows;
  }

  return [];
}

export async function chosenEvent(slug) {
  if (slug === 'favicon.ico') return [];
  const q = 'SELECT * FROM events WHERE slug=$1';
  const values = [slug];

  const result = await query(q, values);
  if (result.rowCount > 0) {
    return result.rows[0];
  }
  return [];
}

export async function getEventID(slug) {
  const q = 'SELECT id FROM events WHERE slug=$1';
  const values = [slug];

  const result = await query(q, values);

  if (result) {
    return result.rows[0];
  }
  return [];
}
