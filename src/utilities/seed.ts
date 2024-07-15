import path from 'path';
import * as fs from 'fs';
import { conectWithRetry } from '../db/index';
import { InstagramScrapperService } from '../services/InstagramService';

const seedData = async () => {
  // Lee el archivo JSON
  const filePath = path.join(__dirname, '../../seed.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const accounts = JSON.parse(fileContent);
  try {
    const appDataSource = (await conectWithRetry()) as any;
    const instagramService = new InstagramScrapperService(appDataSource);
    for (const account of accounts) {
      await instagramService.seedAccountData(account);
    }
    console.log('Se crearon las cuentas');
    process.exit(0);
  } catch (error: any) {
    console.error(`Error al crear usuario: ${error.message}`);
    console.error(`Detalles adicionales: ${error.stack}`);
  }
};

seedData();
