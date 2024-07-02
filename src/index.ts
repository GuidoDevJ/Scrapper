import { envs } from './config';
import { AppDataSource } from './db';
import {
  getInstagramPostData,
  getInstagramPosts,
} from './utilities/playwright';

const main = async () => {
  try {
    // await AppDataSource.initialize();
    // const { links } = await getInstagramPosts('burgos.food');
    const links = [
      // 'https://www.instagram.com/p/CuNlrpMpPpn/',
      // 'https://www.instagram.com/p/CtkT2WUJR-C/?img_index=1',
      'https://www.instagram.com/p/CvqOGgiJ1wj/',
    ];
    for (const link of links) {
      await getInstagramPostData(link);
    }
  } catch (error) {
    console.log(error);
  }
};

main();

// (async () => {
//   console.log(envs.instagramPassword);
//   await getInstagramPosts('carne.pampeana');
// })();
