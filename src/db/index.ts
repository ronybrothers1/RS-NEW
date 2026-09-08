import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

declare global {
  var _postgresPool: Pool | undefined;
}

function getPoolConfig(): PoolConfig {
  const max = Number.parseInt(process.env.SQL_POOL_MAX || '5', 10);
  const common: PoolConfig = {
    max: Number.isFinite(max) && max > 0 ? max : 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  };

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      ...common,
      connectionString: databaseUrl,
    };
  }

  const sslEnabled = process.env.SQL_SSL === 'true';
  const rejectUnauthorized =
    process.env.SQL_SSL_REJECT_UNAUTHORIZED !== 'false';

  return {
    ...common,
    host: process.env.SQL_HOST,
    port: Number.parseInt(process.env.SQL_PORT || '5432', 10),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: sslEnabled ? { rejectUnauthorized } : false,
  };
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(getPoolConfig());

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }

  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
