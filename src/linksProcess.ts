import { AppDataSource } from './db/index';
import { InstagramScrapperService } from './services/InstagramService';
import { getRandomUser } from './utilities/playwright/loadsession';

const main = async () => {
  try {
    // Inicializa la base de datos
    await AppDataSource.initialize();
    // Crea una instancia del servicio de Instagram
    const instagramService = new InstagramScrapperService();
    // Obtén todas las cuentas
    const accounts = await instagramService.getAllPosts();
    if (accounts.length === 0) {
      await AppDataSource.destroy();
    }
    // let availableAccounts = accounts.filter((acc) => acc.account.enabled !== 0);
    const availableAccounts = [
      {
        id: 1,
        username: 'https://www.instagram.com/emilio.varisco/',
        scrapDate: '2024-10-08T03:04:56.000Z',
        numberOfPosts: 0,
        followers: 0,
        following: 0,
        linksPosts: [
          'https://www.instagram.com/burgerkingarg/p/CsTup7oPPTX/?hl=es',
        ],
        profilePictureUrl:
          'https://instagram.fpra1-1.fna.fbcdn.net/v/t51.2885-19/445160623_435095845793444_6794621095705207091_n.jpg?stp=dst-jpg_s150x150&_nc_ht=instagram.fpra1-1.fna.fbcdn.net&_nc_cat=108&_nc_ohc=qIaLdosaj48Q7kNvgHR0DPL&_nc_gid=3fed9d301ca24426ad08376673589fc8&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AYCtcl3eZA2_DvO8Jxj1zCcalw4Xxx3o4D0WqzVprCz-wA&oe=670A8BEF&_nc_sid=7a9f4b',
        account: {
          id: 1,
          accountURL: 'https://www.instagram.com/emilio.varisco/',
          accountType: 'INSTAGRAM',
          enabled: 1,
        },
      },
    ];
    console.log(availableAccounts);
    // // // Verifica si hay cuentas para procesar
    for (const account of availableAccounts) {
      const links = account.linksPosts;

      // Verifica si links es nulo o indefinido
      if (!links || links.length === 0) {
        console.log(
          `No hay links para la cuenta ${account}, pasando a la siguiente...`
        );
        continue;
      }

      const user = await getRandomUser();
      await instagramService.processLinks(links, account as any, user);
    }
    console.log('finish scrap of links');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  }
};

main();
