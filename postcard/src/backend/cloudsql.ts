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

  console.log(
    'db stuff',
    process.env.DATABASE_HOST,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    process.env.DATABASE_NAME
  );
  console.log('maps stuff', process.env.NEXT_PUBLIC_GMP_MAP_ID, process.env.NEXT_PUBLIC_GMP_API_KEY);
  console.log('env', process.env);

  return pool;
}

const pool = await getPool();
export default pool;
