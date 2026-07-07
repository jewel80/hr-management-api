import knex, { type Knex } from 'knex';
import pg from 'pg';
import { buildKnexConfig } from '../config/knex-config';

// Keep DATE / TIME columns as their wire strings (clean YYYY-MM-DD / HH:mm:ss,
// no JS-Date timezone surprises). Parse NUMERIC (salary) as a number. Leave
// TIMESTAMP[TZ] as native JS Date so read and write types agree.
const { builtins, setTypeParser } = pg.types;
setTypeParser(builtins.DATE, (val: string) => val);
setTypeParser(builtins.TIME, (val: string) => val);
setTypeParser(builtins.NUMERIC, (val: string) => Number(val));

/** Shared Knex instance (connection pool) for the application. */
export const db: Knex = knex(buildKnexConfig());

export const closeDb = async (): Promise<void> => {
  await db.destroy();
};
