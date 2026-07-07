import type { Knex } from 'knex';
import { buildKnexConfig } from './src/config/knex-config';

/**
 * Knex CLI config (used by `npm run db:migrate:*` and `npm run db:seed`).
 * Shares the exact same env-driven options as the runtime connection so the two
 * never drift apart.
 */
const config: Knex.Config = buildKnexConfig();

export default config;
