import { AppDataSource } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getRandomUser } from './utilities/playwright/loadsession';

const main = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();
    // Obtén todas las cuentas
    const accounts = await instagramService.getAllPosts();
    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    let availableAccounts = accounts.filter((acc) => acc.account.enabled !== 0);
    // // Verifica si hay cuentas para procesar
    for (const account of availableAccounts) {
      const links = account.linksPosts;

      // Verifica si links es nulo o indefinido
      if (!links || links.length === 0) {
        console.log(
          `No hay links para la cuenta ${account}, pasando a la siguiente...`
        );
        continue;
      }

      const user = await getRandomUser();
      await instagramService.processLinks(links, account, user);
    }
    console.log('finish scrap of links');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

main();
