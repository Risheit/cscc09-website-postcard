// import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { Pool } from 'pg';

async function getPool() {
  // console.log(JSON.stringify({ hey: 'hey'}));
  // console.log('hey');
  // const connector = new Connector();
  // const clientOpts = await connector.getOptions({
  //   instanceConnectionName: 'postcard-439817:me-central1:postcard-db',
  //   ipType: IpAddressTypes.PUBLIC,
  // });
  // console.log('clientOpts', clientOpts);
  const pool = new Pool({
    host: '/cloudsql/postcard-439817:me-central1:postcard-db',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('getPool', pool);

  return pool;
}

const pool = await getPool();
export default pool;
