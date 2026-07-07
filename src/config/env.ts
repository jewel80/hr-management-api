import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const schema = Joi.object<{
  NODE_ENV: string;
  PORT: number;
  APP_URL: string;
  LOG_LEVEL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  UPLOAD_DIR: string;
  UPLOAD_MAX_BYTES: number;
}>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().required(),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  UPLOAD_MAX_BYTES: Joi.number().integer().min(1).default(5_242_880),
}).unknown(true);

const { value, error } = schema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:\n' + error.annotate());
  process.exit(1);
}

export interface Env {
  nodeEnv: string;
  port: number;
  appUrl: string;
  logLevel: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbPoolMin: number;
  dbPoolMax: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  uploadDir: string;
  uploadMaxBytes: number;
}

export const env: Env = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  appUrl: value.APP_URL,
  logLevel: value.LOG_LEVEL,
  dbHost: value.DB_HOST,
  dbPort: value.DB_PORT,
  dbUser: value.DB_USERNAME,
  dbPassword: value.DB_PASSWORD,
  dbName: value.DB_NAME,
  dbPoolMin: value.DB_POOL_MIN,
  dbPoolMax: value.DB_POOL_MAX,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  uploadDir: value.UPLOAD_DIR,
  uploadMaxBytes: value.UPLOAD_MAX_BYTES,
};
