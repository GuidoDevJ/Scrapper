import { AppDataSource, conectWithRetry } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  try {
    (await AppDataSource.initialize()) as any;
    const instagramService = new InstagramScrapperService();
    const accounts = await instagramService.getAllAccounts();
    console.log('Accounts', accounts);
    if (accounts.length <= 0) return 'No hay cuentas en la base de datos';
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
