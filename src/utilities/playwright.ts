import { Page, chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { AllData } from '../types/types';
import 'dotenv/config';

export const loginInstagram = async (page: Page) => {
  await page.goto('https://www.instagram.com/accounts/login/');
  await page.fill(
    'input[name="username"]',
    process.env.INSTAGRAM_USERNAME || ''
  );
  await page.fill(
    'input[name="password"]',
    process.env.INSTAGRAM_PASSWORD || ''
  );
  await page.click('button[type="submit"]');
  const session = await page.context().cookies();
  fs.writeFileSync(
    path.resolve(__dirname, 'instagram-session.json'),
    JSON.stringify(session)
  );
};

const loadSession = async (page: Page) => {
  const sessionFile = path.resolve(__dirname, 'instagram-session.json');
  if (fs.existsSync(sessionFile)) {
    console.log('Session file found');
    const cookies = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    await page.context().addCookies(cookies);
  } else {
    await loginInstagram(page);
  }
};

const getProfileData = async (page: Page) => {
  return await page.evaluate(() => {
    const profileImg = document.querySelector('header img') as HTMLImageElement;
    const ul = document.querySelector('header ul') as HTMLElement;
    const liElements = ul.querySelectorAll('li');
    const spans: HTMLElement[] = [];

    liElements.forEach((li) => {
      const spanElements = li.querySelectorAll('span span');
      spanElements.forEach((span) => spans.push(span as HTMLElement));
    });
    return {
      profileImg: profileImg.src,
      following: +spans.map((span) => span.innerHTML)[2],
      followers: +spans.map((span) => span.innerHTML)[1],
      posts: +spans.map((span) => span.innerHTML)[0],
    };
  });
};

const getPostLinks = async (page: Page) => {
  return await page.evaluate(() => {
    const article = document.querySelector('article');
    if (!article) return [];

    const postDivs = Array.from(
      article.querySelectorAll('div > div > div > div')
    );
    const linksArray = postDivs.map((postDiv) => {
      const links = postDiv.querySelectorAll('a');
      return Array.from(links).map((link) => link.href);
    });
    return linksArray.flat();
  });
};

export const getInstagramPosts = async (username: string): Promise<AllData> => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await loadSession(page);

  let allData: AllData = {
    posts: 0,
    followers: 0,
    following: 0,
    links: [],
    profileImg: '',
  };

  try {
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.waitForSelector('header');

    // Obtener datos del perfil
    const profileData = await getProfileData(page);
    allData.profileImg = profileData.profileImg;
    allData.followers = profileData.followers;
    allData.posts = profileData.posts;
    allData.following = profileData.following;

    let prevHeight = 0;
    let currentHeight = 0;
    let reachedEnd = false;
    const allLinks = new Set<string>();

    // Función para realizar el scroll infinito
    while (!reachedEnd) {
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === prevHeight) {
        reachedEnd = true;
      } else {
        prevHeight = currentHeight;

        // Press the End key to load more posts
        await page.keyboard.press('End');

        // Esperar un tiempo para asegurarse de que se cargan nuevos elementos
        await page.waitForTimeout(10000); // Esperar 10 segundos

        // Obtener los enlaces de los posts
        const links = await getPostLinks(page);
        links.forEach((link: string) => {
          if (!allLinks.has(link)) {
            allLinks.add(link);
          }
        });
      }
    }

    allData.links = Array.from(allLinks);
    await browser.close();
    return allData;
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error);
    await browser.close();
    throw error;
  }
};
const getMediaData = async (page: Page) => {
  return await page.evaluate(() => {
    const mainDiv = document.querySelector('main > div > div > div');
    if (!mainDiv) return { images: [], videos: [] };

    const imgElements = Array.from(mainDiv.querySelectorAll('img')).map(
      (img) => (img as HTMLImageElement).src
    );
    const videoElements = Array.from(mainDiv.querySelectorAll('video')).map(
      (video) => (video as HTMLVideoElement).src
    );

    return {
      images: imgElements,
      videos: videoElements,
    };
  });
};
export const getInstagramPostData = async (url: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Intentar extraer el número de likes usando la expresión regular
  await loadSession(page);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('main');
    const data = await page.evaluate(() => {
      // Expresión regular para encontrar el número de likes
      const regex = /(\d+)\s+likes/;
      const regex2 = /<[^>]*>/g;

      const mainDiv = document.querySelector('main > div > div > div');
      if (!mainDiv) return { images: '' };
      const deepDiv = mainDiv.querySelector('div > div > div'); // Ajusta según tu necesidad
      if (!deepDiv) return { images: [], videos: [] };
      const imgElements = Array.from(deepDiv.querySelectorAll('img')).map(
        (img) => (img as HTMLImageElement).src
      );
      const videoElements = Array.from(deepDiv.querySelectorAll('video')).map(
        (video) => (video as HTMLVideoElement).src
      );
      const title =
        mainDiv.children[1].children[0].children[2].children[0].children[0].children[0].children[1].children[0].children[0].querySelector(
          'div'
        )?.children[1].innerHTML;
      const likesElement =
        mainDiv.children[1]?.children[0]?.children[3]?.children[1]?.children[0]?.children[1]?.querySelector(
          'span a span span'
        );

      const likes = likesElement ? likesElement.innerHTML : 'N/A'; // Si likesElement es null, establece un valor predeterminado como 'N/A'

      const ownerCommentsContainer =
        mainDiv.children[1]?.children[0]?.children[2]?.children[0]?.children[1];
      if (!ownerCommentsContainer.children) return []; // Asegúrate de manejar casos donde el contenedor de comentarios no se encuentra

      // Obtener todos los comentarios
      const allComments = Array.from(ownerCommentsContainer.children);

      let allCom = allComments.map((commentElement) => {
        // Obtener el dueño del comentario
        const ownerElement = commentElement.querySelector('span a span');
        const owner = ownerElement ? ownerElement.innerHTML.trim() : '';

        // Obtener el texto del comentario
        const commentText =
          commentElement?.children[0]?.children[0]?.children[1]?.children[0]
            ?.children[0]?.children[0]?.children[1]?.children[0]?.innerHTML;
        const finalComment = commentText ? commentText.trim() : '';
        const likesOfComment =
          commentElement?.children[0]?.children[0]?.children[1]?.children[0]?.children[1].querySelector(
            'span'
          )?.innerHTML as string;
        const match = regex.exec(likesOfComment);
        // Variable para almacenar el número de likes
        let likesNumber = 0;

        // Si se encuentra coincidencia con la expresión regular
        if (match) {
          // Obtener el número de likes (la primera coincidencia capturada)
          likesNumber = parseInt(match[1], 10);
        }
        return {
          owner,
          finalComment: finalComment.replace(regex2, ''),
          likesNumber,
        };
      });
      allCom = allCom.filter((comment) => comment.owner !== '');
      return {
        title: title?.replace(regex2, ''),
        allCom,
        imgElements,
        videoElements,
        likes,
      };
    });

    await browser.close();
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${url}:`, error);
    await browser.close();
    throw error;
  }
};

// const data = await page.evaluate(() => {
//   const mainDiv = document.querySelector('main > div > div > div');
//   if (!mainDiv) return { images: [], videos: [] };

//   const deepDiv = mainDiv.querySelector('div > div > div'); // Ajusta según tu necesidad
//   if (!deepDiv) return { images: [], videos: [] };

//   const imgElements = Array.from(deepDiv.querySelectorAll('img')).map(
//     (img) => (img as HTMLImageElement).src
//   );
//   const videoElements = Array.from(deepDiv.querySelectorAll('video')).map(
//     (video) => (video as HTMLVideoElement).src
//   );

//   return {
//     images: imgElements,
//     videos: videoElements,
//   };
// });
