import { env } from '../config/env';

type Level = 'error' | 'warn' | 'info' | 'debug';

const ORDER: Record<Level, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const configured = env.logLevel as Level;
const threshold = ORDER[configured] ?? ORDER.info;
const stamp = (): string => new Date().toISOString();

/* eslint-disable no-console */
export const logger = {
  error: (...args: unknown[]): void => {
    if (threshold >= ORDER.error) console.error('[ERROR]', stamp(), ...args);
  },
  warn: (...args: unknown[]): void => {
    if (threshold >= ORDER.warn) console.warn('[WARN]', stamp(), ...args);
  },
  info: (...args: unknown[]): void => {
    if (threshold >= ORDER.info) console.log('[INFO]', stamp(), ...args);
  },
  debug: (...args: unknown[]): void => {
    if (threshold >= ORDER.debug) console.debug('[DEBUG]', stamp(), ...args);
  },
};
