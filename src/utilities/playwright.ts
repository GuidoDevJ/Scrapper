import { Page, chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { AllData, InstagramPostDetails } from '../types/types';
import { envs } from '../config';

export const loginInstagram = async (page: Page) => {
  await page.goto('https://www.instagram.com/accounts/login/');
  await page.fill('input[name="username"]', envs.instagramUsername || '');
  await page.fill('input[name="password"]', envs.instagramPassword || '');
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
  const data = await page.evaluate(() => {
    const profileImg = document.querySelector('header img') as HTMLImageElement;
    const header = document.querySelector('header') as HTMLElement;
    const liElements = header.querySelectorAll('li');
    const spans: any[] = [];

    liElements.forEach((list) => {
      const number = list.querySelector('span');
      spans.push(number?.querySelector('span')?.innerHTML as any);
    });
    return {
      profileImg: profileImg.src,
      following: parseInt(spans[2].replace(/,/g, '.')),
      followers: parseInt(spans[1].replace(/,/g, '.')),
      posts: parseInt(spans[0].replace(/,/g, '.')),
    };
  });
  console.log('holllaaaaaaaaaaaaaaaaaa======>', data);
  return data;
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
    allData.followers = profileData.followers as any;
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
export const getInstagramPostData = async (
  url: string
): Promise<InstagramPostDetails> => {
  const browser = await chromium.launch({
    headless: false, // Cambia esto si no quieres que se ejecute en fondoñ
  });
  const page = await browser.newPage();
  await loadSession(page);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('main');
    const data = await page.evaluate(() => {
      // Expresión regular para encontrar el número de likes
      const deleteTags = /<[^>]*>/g;

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
        mainDiv.children[1].children[0]?.children[3]?.children[1].querySelectorAll(
          'span'
        );
      const date = mainDiv.children[1].children[0]?.children[3]
        ?.querySelector('time')
        ?.getAttribute('datetime');
      const likesHTML = likesElement
        ? likesElement[likesElement.length - 1].innerHTML
        : '0';
      return {
        title: title?.replace(deleteTags, ''),
        imgElements,
        videoElements,
        datePost: date,
        likes: parseInt(likesHTML) ? parseInt(likesHTML) : 0,
      };
    });

    const scrollUntilEnd = async () => {
      let canScroll = true;
      while (canScroll) {
        canScroll = await page.evaluate(() => {
          const mainDiv = document.querySelector('main > div > div > div')
            ?.children[1].children[0].children[2];
          const ownerCommentsContainer =
            mainDiv?.children[1]?.children[0]?.children[2]?.children[0]
              ?.children[1];
          if (mainDiv) {
            const previousScrollTop = mainDiv.scrollTop;
            mainDiv.scrollBy(0, 1000);
            const newScrollTop = mainDiv.scrollTop;
            return newScrollTop > previousScrollTop;
          }
          return false;
        });
        console.log('Can scroll:', canScroll);
        await page.waitForTimeout(1000); // Espera un momento para cargar más contenido
      }
    };
    // Ejecutar el desplazamiento infinito
    await scrollUntilEnd();
    // Extraer Todos los comentarios después del desplazamiento
    const commentsDivs = await page.evaluate(() => {
      const checkLikes = /(\d+)\s*(likes?|me\s+gustas?)/i;
      const deleteTags = /<[^>]*>/g;
      const mainDiv = document.querySelector('main > div > div > div');
      const ownerCommentsContainer =
        mainDiv?.children[1]?.children[0]?.children[2]?.children[0]
          ?.children[1];
      if (ownerCommentsContainer) {
        const allComments = Array.from(ownerCommentsContainer.children);

        let allCom = allComments.map((commentElement) => {
          // Obtener el dueño del comentario
          const ownerElement = commentElement.querySelector('span a span');
          const owner = ownerElement ? ownerElement.innerHTML.trim() : '';
          if (commentElement.children[1]) {
            const span = commentElement.children[1].querySelector('span');
            if (span) span.click();
          }
          // Obtener el texto del comentario
          const commentText =
            commentElement?.children[0]?.children[0]?.children[1]?.children[0]
              ?.children[0]?.children[0]?.children[1]?.children[0]?.innerHTML;
          const finalComment = commentText ? commentText.trim() : '';
          const likesOfComment =
            commentElement?.children[0]?.children[0]?.children[1]?.children[0]?.children[1].querySelector(
              'span'
            )?.innerHTML as string;
          const match = checkLikes.exec(likesOfComment);
          // Variable para almacenar el número de likes
          let likesNumber = 0;

          // Si se encuentra coincidencia con la expresión regular
          if (match) {
            // Obtener el número de likes (la primera coincidencia capturada)
            likesNumber = parseInt(match[1], 10);
          }
          // Obtener date del comentario
          const dateOfComment =
            commentElement?.children[0]
              ?.querySelector('time')
              ?.getAttribute('datetime') || '';
          return {
            owner,
            finalComment: finalComment.replace(deleteTags, ''),
            likesNumber,
            commentDate: dateOfComment,
          };
        });
        allCom = allCom.filter((comment) => comment.owner !== '');

        return allCom;
      }
      return [];
    });

    await page.waitForSelector('ul div');
    const responseComments = await page.evaluate(() => {
      const checkLikes = /(\d+)\s*(likes?|me\s+gustas?)/i;
      const deleteTags = /<[^>]*>/g;
      const mainDiv = document.querySelector('main > div > div > div');
      const ownerCommentsContainer =
        mainDiv?.children[1]?.children[0]?.children[2]?.children[0]
          ?.children[1];
      if (ownerCommentsContainer) {
        const allComments = Array.from(ownerCommentsContainer.children);

        let allCom = allComments.map((commentElement) => {
          // Obtener el dueño del comentario
          const ownerElement = commentElement.querySelector('span a span');
          const owner = ownerElement ? ownerElement.innerHTML.trim() : '';
          if (commentElement.children[1] !== undefined) {
            const uls = commentElement.children[1].querySelector('ul');
            const arrUls = Array.from(uls?.children || []);
            console.log('Hola objeto final', commentElement);
            const commentText = arrUls.map((div) => {
              // const ownerElement = commentElement.querySelector('span a span');
              // const owner = ownerElement ? ownerElement.innerHTML.trim() : '';
              const commentText =
                div.children[0].children[1].children[0].children[0].children[0].children[0].querySelector(
                  'span a span'
                )?.innerHTML;
              const finalComment = commentText ? commentText.trim() : '';
              const dateOfComment =
                div.children[0].children[1].children[0].children[0].children[0].children[0]
                  .querySelector('time')
                  ?.getAttribute('datetime');

              // return {
              //   dateOfComment:
              //     div.children[0].children[1].children[0].children[0].children[0].children[0]
              //       .querySelector('time')
              //       ?.getAttribute('datetime'),
              //   ownerComment:
              //     div.children[0].children[1].children[0].children[0].children[0].children[0].querySelector(
              //       'span a span'
              //     )?.innerHTML,
              //   commentText: finalComment.replace(deleteTags, ''),
              // };
            });
          }
        });
        return [];
      }
    });
    const { title, datePost, imgElements, likes, videoElements } = data as any;
    // Mantén el navegador abierto para ver el resultado
    await page.waitForTimeout(5000);
    await browser.close();
    return {
      title,
      allCom: commentsDivs,
      imgElements,
      videoElements,
      datePost,
      likes,
    } as InstagramPostDetails;
  } catch (error) {
    console.error(`Error fetching data for ${url}:`, error);
    await browser.close();
    throw error;
  }
};
