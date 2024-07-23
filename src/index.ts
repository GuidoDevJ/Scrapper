import { AppDataSource } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
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
      const data = await getInstagramPosts(account.accountURL);
      await instagramService.processData(data, account);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

main();
