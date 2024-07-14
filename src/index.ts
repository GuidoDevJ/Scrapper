import { conectWithRetry } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  const userName = 'burgerkingcorrientes';
  try {
    const appDataSource = (await conectWithRetry()) as any;
    const instagramService = new InstagramScrapperService(appDataSource);
    // const data = await getInstagramPosts(userName);
    const data = {
      links: [],
      followers: 0,
      following: 0,
      posts: 0,
      profileImg: '',
    };
    await instagramService.processData(data, userName);
    console.log('Llegue al final');
  } catch (error: any) {
    console.error(`Error al crear usuario: ${error.message}`);
    console.error(`Detalles adicionales: ${error.stack}`);
  }
};

main();
