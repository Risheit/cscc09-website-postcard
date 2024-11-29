import { Pool } from 'pg';

async function getPool() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
}

// This is a good spot to check environment variables being passed into the server.
console.log('DATABASE_HOST', process.env.DATABASE_HOST);
console.log('DATABASE_USER', process.env.DATABASE_USER);
console.log('DATABASE_PASSWORD', process.env.DATABASE_PASSWORD);
console.log('DATABASE_NAME', process.env.DATABASE_NAME);
console.log('SERVER ENV', process.env);

const pool = await getPool();
export default pool;
