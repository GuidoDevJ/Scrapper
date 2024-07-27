import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config();

interface EnvVars {
  DB_HOST: string;
  DB_PORT: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  INSTAGRAM_USERNAME: string;
  INSTAGRAM_PASSWORD: string;
  PROXY_URL: string;
}

const envsSchema = joi
  .object({
    DB_HOST: joi.string().required(),
    DB_PORT: joi.string().required(),
    POSTGRES_USER: joi.string().required(),
    POSTGRES_PASSWORD: joi.string().required(),
    POSTGRES_DB: joi.string().required(),
    INSTAGRAM_USERNAME: joi.string().required(),
    INSTAGRAM_PASSWORD: joi.string().required(),
    PROXY_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  dbHost: envVars.DB_HOST,
  dbPort: envVars.DB_PORT,
  dbUser: envVars.POSTGRES_USER,
  dbPassword: envVars.POSTGRES_PASSWORD,
  dbName: envVars.POSTGRES_DB,
  instagramUsername: envVars.INSTAGRAM_USERNAME,
  instagramPassword: envVars.INSTAGRAM_PASSWORD,
  proxyUrl: envVars.PROXY_URL,
};
