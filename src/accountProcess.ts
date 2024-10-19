import { AppDataSource } from './db/index';
import { AccountEntity } from './entities/Account';
import { InstagramScrapperService } from './services/InstagramService';
import { getRandomUser } from './utilities/playwright/loadsession';
import { subdivideArray } from './utilities/subDivideArrays';
const pattern = /instagram\.com\/([A-Za-z0-9._]+)/;

const mainProcessAccounts = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();

    // Obtén todas las cuentas
    const accounts = await instagramService.getAllAccounts();
    const onlyOne = accounts.length === 1;
    // Verifica si hay cuentas para procesar

    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    // // Procesa cada cuenta de Instagram
    // for (const account of accounts) {
    //   if (account.enabled === 0) continue;
    //   const match = account.accountURL.match(pattern);
    //   if (match) {
    //     const username = match[1];
    //     const user = await getRandomUser();
    //     console.log(`Account ${account.accountURL} `, user);
    //     await instagramService.processPosts(username, account, user, onlyOne);
    //   } else {
    //     console.error(
    //       `No se pudo extraer el nombre de usuario de la URL: ${account.accountURL}`
    //     );
    //   }
    // }

    let availableAccounts = accounts.filter(
      (account: AccountEntity) => account.enabled !== 0
    );
    const accountsSubDivide = subdivideArray(availableAccounts, 5);
    for (const accounts of accountsSubDivide) {
      let user = await getRandomUser(); // Obtener el primer usuario
      await instagramService.processPosts(user, onlyOne, accounts);
    }

    console.log('All accounts processed successfully.');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

mainProcessAccounts();
