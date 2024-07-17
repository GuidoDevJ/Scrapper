import { conectWithRetry } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  try {
    const appDataSource = (await conectWithRetry()) as any;
    const instagramService = new InstagramScrapperService(appDataSource);
    const accounts = await instagramService.getAllAccounts();

    for (const account of accounts) {
      const data = await getInstagramPosts(account.accountURL);
      await instagramService.processData(data, account);
    }
    console.log('FIN');
  } catch (error: any) {
    console.error(`Error al crear usuario: ${error.message}`);
    console.error(`Detalles adicionales: ${error.stack}`);
  }
};

main();
