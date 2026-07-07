import { join } from 'node:path';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Attendance } from './entities/attendance.entity';
import { Employee } from './entities/employee.entity';
import { HrUser } from './entities/hr-user.entity';

/** Entity classes registered with TypeORM across the application. */
export const APP_ENTITIES = [HrUser, Employee, Attendance];

/** TypeORM query-log categories accepted by the postgres driver. */
type LogCategory = 'query' | 'error' | 'schema' | 'migration' | 'log' | 'info' | 'warn';

/**
 * Plain connection parameters shared between the NestJS runtime
 * (`TypeOrmModule.forRootAsync`) and the standalone CLI `DataSource`
 * (`src/data-source.ts`) so the two paths never drift apart.
 */
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
  ssl: boolean;
  synchronize: boolean;
  poolMin: number;
  poolMax: number;
  logging: boolean | LogCategory[];
}

/**
 * Builds Postgres `DataSourceOptions` from a plain connection config.
 * Migrations live under `src/migrations` (resolved at runtime to either the
 * TS or compiled JS files depending on how the process is launched).
 */
export function buildTypeOrmOptions(
  config: DatabaseConnectionConfig,
): PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    schema: config.schema,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    synchronize: config.synchronize,
    entities: APP_ENTITIES,
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    migrationsTableName: 'migrations',
    // pg driver pool sizing is controlled via `extra`.
    extra: {
      max: config.poolMax,
      min: config.poolMin,
    },
    logging: config.logging,
  };
}
