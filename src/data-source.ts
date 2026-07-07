import 'reflect-metadata';
// Load `.env` from the project root when this DataSource is used by the
// TypeORM CLI (ts-node) or the seed script, which run outside the Nest
// @nestjs/config bootstrap.
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './database/typeorm-options';

const bool = (value: string | undefined): boolean =>
  (value ?? '').toLowerCase() === 'true';

const numOr = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Standalone DataSource consumed by the TypeORM CLI (migrations) and by the
 * seed script. Mirrors the runtime connection options built from the same env.
 */
export default new DataSource(
  buildTypeOrmOptions({
    host: process.env.DB_HOST ?? 'localhost',
    port: numOr(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'hr_management',
    schema: process.env.DB_SCHEMA ?? 'public',
    ssl: bool(process.env.DB_SSL),
    synchronize: bool(process.env.DB_SYNC),
    poolMin: numOr(process.env.DB_POOL_MIN, 2),
    poolMax: numOr(process.env.DB_POOL_MAX, 10),
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }),
);
