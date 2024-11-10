import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { Pool } from 'pg';

const connector = new Connector();
const clientOpts = await connector.getOptions({
  instanceConnectionName: 'postcard-439817:me-central1:postcard-db',
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