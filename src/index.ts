import { conectWithRetry } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  const userName = 'enzo_fabrizio62';
  try {
    const appDataSource = (await conectWithRetry()) as any;
    const instagramService = new InstagramScrapperService(appDataSource);
    const data = await getInstagramPosts(userName);
    // await instagramService.processData(data, userName);
    console.log('Llegue al final', data);
  } catch (error: any) {
    console.error(`Error al crear usuario: ${error.message}`);
    console.error(`Detalles adicionales: ${error.stack}`);
  }
};

main();
