import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { Pool } from 'pg';

function dbName() {
  console.log('env variables', process.env);
  return process.env.DATABASE_NAME!;
}

const connector = new Connector();
const clientOpts = await connector.getOptions({
  instanceConnectionName: dbName(),
  ipType: IpAddressTypes.PUBLIC,
});

const pool = new Pool({
  ...clientOpts,
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;