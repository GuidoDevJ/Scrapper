import { DataSource } from 'typeorm';
import { envs } from '../config';
export const AppDataSource = new DataSource({
  type: envs.dbName as any,
  host: envs.dbHost,
  port: +envs.dbPort,
  username: envs.dbUser,
  password: envs.dbPassword,
  database: envs.dbName,
  // logging: true,
  synchronize: true,
  entities: ['src/db/entities/*.ts'],
});
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5 segundos

export const conectWithRetry = async (retries = MAX_RETRIES): Promise<any> => {
  try {
    const appSource = await AppDataSource.initialize();
    return appSource;
  } catch (err: any) {
    if (retries > 0) {
      console.error(
        `Error de conexión: ${err.message}. Reintentando en ${
          RETRY_DELAY / 1000
        } segundos... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`
      );
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return conectWithRetry(retries - 1);
    } else {
      console.error(
        'No se pudo conectar a la base de datos después de varios intentos:',
        err
      );
      process.exit(1);
    }
  }
};
