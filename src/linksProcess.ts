import { AppDataSource } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { fetchProxies } from './utilities/fetchProxies';
import { getRandomUser } from './utilities/playwright/loadsession';

const main = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    await fetchProxies();
    // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();

    // Obtén todas las cuentas
    const accounts = await instagramService.getAllPosts();

    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    // Verifica si hay cuentas para procesar
    for (const account of accounts) {
      const user = await getRandomUser();
      const links = account.linksPosts;
      await instagramService.processLinks(links, account, user);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

main();
