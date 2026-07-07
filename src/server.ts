import { createApp } from './app';
import { env } from './config/env';
import { closeDb } from './db/knex';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`HTTP server listening on http://localhost:${env.port}`);
  logger.info(`Photos served at http://localhost:${env.port}/uploads/<filename>`);
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down...`);
  server.close((err) => {
    if (err) {
      logger.error('Error closing server', err);
    }
    void closeDb().finally(() => process.exit(0));
  });
  // Hard stop fallback if graceful shutdown stalls.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
