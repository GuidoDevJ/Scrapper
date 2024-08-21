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
    function chunkArray(array: any[], size: number) {
      const chunked = [];
      for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
      }
      return chunked;
    }
    // Obtén todas las cuentas
    const accounts = await instagramService.getAllPosts();
    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    // Verifica si hay cuentas para procesar
    for (const account of accounts) {
      const links = account.linksPosts;

      // Verifica si links es nulo o indefinido
      if (!links || links.length === 0) {
        console.log(
          `No hay links para la cuenta ${account}, pasando a la siguiente...`
        );
        continue;
      }

      const user = await getRandomUser();
      console.log('Estoy por procesar los links');
      await instagramService.processLinks(links, account, user);
    }

    console.log('finish');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

main();
