const { Pool } = require('pg');
require('dotenv').config();

const dbHost = process.env.DB_HOST;
const useSsl = process.env.DB_SSL === 'true' || (typeof dbHost === 'string' && dbHost.includes('render.com'));

const databaseUrl = process.env.DATABASE_URL;
const parsedPort = Number.parseInt(process.env.DB_PORT, 10);
const dbPort = Number.isFinite(parsedPort) && parsedPort > 0 && parsedPort < 65536
  ? parsedPort
  : 5432;

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: dbHost,
      port: dbPort,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
