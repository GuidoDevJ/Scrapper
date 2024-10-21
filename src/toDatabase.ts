import { AppDataSource } from './db';

async function testDatabaseConnection() {
  try {
    await AppDataSource.initialize();
    console.log('Conexión a la base de datos exitosa');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

testDatabaseConnection();
