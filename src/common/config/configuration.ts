/**
 * Strongly-typed application configuration, read from environment variables and
 * exposed via `ConfigService.get('...')`. Default values mirror the Joi schema
 * in {@link envValidationSchema} so both paths agree.
 */
export const configuration = () => {
  const bool = (value: string | undefined): boolean =>
    (value ?? '').toLowerCase() === 'true';

  const numberOr = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: numberOr(process.env.PORT, 3000),
    logLevel: process.env.LOG_LEVEL ?? 'log',
    app: {
      url: process.env.APP_URL ?? 'http://localhost:3000',
      uploadDir: process.env.UPLOAD_DIR ?? './uploads',
      uploadMaxBytes: numberOr(process.env.UPLOAD_MAX_BYTES, 5_242_880),
    },
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: numberOr(process.env.DB_PORT, 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'hr_management',
      schema: process.env.DB_SCHEMA ?? 'public',
      ssl: bool(process.env.DB_SSL),
      synchronize: bool(process.env.DB_SYNC),
      poolMin: numberOr(process.env.DB_POOL_MIN, 2),
      poolMax: numberOr(process.env.DB_POOL_MAX, 10),
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;
