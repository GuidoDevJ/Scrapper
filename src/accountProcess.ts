import { AppDataSource } from './db/index';
import { AccountEntity } from './entities/Account';
import { InstagramScrapperService } from './services/InstagramService';
import { clearAllSessions } from './utilities/playwright/clearAllSession';
import { getRandomUser } from './utilities/playwright/loadsession';
import { subdivideArray } from './utilities/subDivideArrays';

const mainProcessAccounts = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();

    // // Obtén todas las cuentas
    const accounts = await instagramService.getAllAccounts();
    const onlyOne = accounts.length === 1;
    // Verifica si hay cuentas para procesar

    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }

    let availableAccounts = accounts.filter(
      (account: AccountEntity) => account.enabled !== 0
    );
    const accountsSubDivide = subdivideArray(availableAccounts, 4);

    for (const accounts of accountsSubDivide) {
      let user = await getRandomUser(); // Obtener el primer usuario
      await instagramService.processPosts(user, onlyOne, accounts as any);
    }
    clearAllSessions();
    console.log('All accounts processed successfully.');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

mainProcessAccounts();
