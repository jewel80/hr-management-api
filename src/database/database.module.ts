import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions, type DatabaseConnectionConfig } from './typeorm-options';

/** Reads the `database.*` config section into a fully-populated object. */
const databaseConfigFrom = (config: ConfigService): DatabaseConnectionConfig => ({
  host: config.get<string>('database.host') ?? 'localhost',
  port: config.get<number>('database.port') ?? 5432,
  username: config.get<string>('database.username') ?? 'postgres',
  password: config.get<string>('database.password') ?? '',
  database: config.get<string>('database.database') ?? 'hr_management',
  schema: config.get<string>('database.schema') ?? 'public',
  ssl: config.get<boolean>('database.ssl') ?? false,
  synchronize: config.get<boolean>('database.synchronize') ?? false,
  poolMin: config.get<number>('database.poolMin') ?? 2,
  poolMax: config.get<number>('database.poolMax') ?? 10,
  logging:
    config.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : ['error'],
});

/**
 * Registers the global TypeORM connection from environment-driven config.
 * Connection pooling, SSL, and sync behaviour are all derived from env vars.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildTypeOrmOptions(databaseConfigFrom(config)),
    }),
  ],
})
export class DatabaseModule {}
