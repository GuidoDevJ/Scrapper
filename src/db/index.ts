import { DataSource } from 'typeorm';
import { envs } from '../config';
export const AppDataSource = new DataSource({
  type: envs.dbName as any,
  host: envs.dbHost,
  port: +envs.dbPort,
  username: envs.dbUser,
  password: envs.dbPassword,
  database: envs.dbName,
  logging: true,
  synchronize: true,
  entities: ['src/db/entities/*.ts'],
});
