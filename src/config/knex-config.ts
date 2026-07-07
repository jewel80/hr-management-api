import type { Knex } from 'knex';
import { env } from './env';

/**
 * Shared Knex config used by both the runtime app (`src/db/knex.ts`) and the
 * CLI (`knexfile.ts`) so the two paths never drift apart.
 */
export const buildKnexConfig = (): Knex.Config => ({
  client: 'pg',
  connection: {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
  },
  pool: { min: env.dbPoolMin, max: env.dbPoolMax },
  migrations: {
    directory: './migrations',
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
  },
});
