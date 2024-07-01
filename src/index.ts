import { envs } from './config';
import { AppDataSource } from './db';
import { getInstagramPosts } from './utilities/playwright';

const main = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
  } catch (error) {
    console.log(error);
  }
};

main();

// (async () => {
//   console.log(envs.instagramPassword);
//   await getInstagramPosts('carne.pampeana');
// })();
