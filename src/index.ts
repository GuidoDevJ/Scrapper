import { AppDataSource } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { fetchProxies } from './utilities/fetchProxies';
import { getInstagramPosts } from './utilities/playwright/playwright';
const pattern = /instagram\.com\/([A-Za-z0-9._]+)/;

const main = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    // await fetchProxies();
    // // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();

    // Obtén todas las cuentas
    const accounts = await instagramService.getAllAccounts();

    // Verifica si hay cuentas para procesar
    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    // const accounts: [any] = [
    //   {
    //     accountType: 'INSTAGRAM',
    //     accountURL: 'https://www.instagram.com/gerardobalmaceda/',
    //   },
    // ];
    // Procesa cada cuenta de Instagram
    for (const account of accounts) {
      const match = account.accountURL.match(pattern);
      if (match) {
        const username = match[1];
        const data = await getInstagramPosts(username);
        await instagramService.processData(data, account);
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

main();
