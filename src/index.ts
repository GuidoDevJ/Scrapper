import { AppDataSource } from './db';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  const userName = 'juanrinas12';
  try {
    const appDataSource = await AppDataSource.initialize();
    const instagramService = new InstagramScrapperService(appDataSource);
    const data = await getInstagramPosts(userName);
    await instagramService.processData(data, userName);
    console.log('Llegue al final');
  } catch (error) {
    console.log(error);
  }
};

main();
