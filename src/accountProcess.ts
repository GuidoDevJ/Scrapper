import { AppDataSource } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getRandomUser } from './utilities/playwright/loadsession';
import { getInstagramPosts } from './utilities/playwright/playwright';
const pattern = /instagram\.com\/([A-Za-z0-9._]+)/;

const mainProcessAccounts = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();

    // Obtén todas las cuentas
    const accounts = await instagramService.getAllAccounts();

    // Verifica si hay cuentas para procesar

    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    // Procesa cada cuenta de Instagram
    for (const account of accounts) {
      const match = account.accountURL.match(pattern);
      if (match) {
        const username = match[1];
        const user = await getRandomUser();
        console.log(`Account ${account}`, user);
        const data = await getInstagramPosts(username, user);
        await instagramService.processPosts(data, account as any, user);
      } else {
        console.error(
          `No se pudo extraer el nombre de usuario de la URL: ${account.accountURL}`
        );
      }
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

mainProcessAccounts();
