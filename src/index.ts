import { conectWithRetry } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  const userName = 'enzo_fabrizio62';
  try {
    const appDataSource = (await conectWithRetry()) as any;
    const instagramService = new InstagramScrapperService(appDataSource);
    // const data = await getInstagramPosts(userName);
    const data = {
      id: '0987654321',
      caption: 'Another test post',
      likes: 20,
      comments: 10,
      date: '2023-05-02T15:30:00Z',
      image: 'https://example.com/image2.jpg',
    };
    await instagramService.processData(data, userName);
    console.log('Llegue al final');
  } catch (error: any) {
    console.error(`Error al crear usuario: ${error.message}`);
    console.error(`Detalles adicionales: ${error.stack}`);
  }
};

main();
