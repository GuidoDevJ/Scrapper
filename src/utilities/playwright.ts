import { Page, chromium } from 'playwright';
import * as fs from 'fs';
import { AllData, InstagramPostDetails } from '../types/types';
import { envs } from '../config';
import { getRandomProxy } from './proxyHelper';
const sessionFilePath = './sessionCookies.json';

// Función para guardar las cookies en un archivo
async function saveSession(context: any) {
  const cookies = await context.cookies();
  fs.writeFileSync(sessionFilePath, JSON.stringify(cookies, null, 2));
}

// Función para cargar las cookies desde un archivo
async function loadSession(context: any) {
  if (fs.existsSync(sessionFilePath)) {
    const cookies = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    for (const cookie of cookies) {
      await context.addCookies([cookie]);
    }
    return true;
  } else {
    console.log(
      'No se encontraron cookies de sesión, se procederá a iniciar sesión.'
    );
  }
}

// Función para iniciar sesión
export const loginInstagram = async (page: Page) => {
  await page.goto('https://www.instagram.com/accounts/login/');
  await page.waitForTimeout(5000); // Ajusta esto según tu necesidad

  await page.fill('input[name="username"]', envs.instagramUsername || '');
  await page.fill('input[name="password"]', envs.instagramPassword || '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(50000); // Ajusta esto según tu necesidad
  await saveSession(page.context());
};

// Función principal para cargar sesión e iniciar sesión si es necesario
const loadSessionAndLogin = async (page: Page) => {
  const context = page.context();
  const cookies = await loadSession(context);

  await page.goto('https://www.instagram.com');

  if (!cookies) {
    console.log('Sesión no válida, iniciando sesión...');
    await loginInstagram(page);
  } else {
    console.log('Sesión cargada exitosamente, no es necesario iniciar sesión.');
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
  return data;
};

const getPostLinks = async (page: Page) => {
  return await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return [];
    const postDivs = Array.from(
      main.querySelectorAll('div > div > div > div > div')
    );
    const linksArray = postDivs.map((postDiv) => {
      const links = postDiv.querySelectorAll('a');
      return Array.from(links).map((link) => link.href);
    });

    return linksArray.flat();
  });
};

export const getInstagramPosts = async (username: string): Promise<AllData> => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await loadSessionAndLogin(page);

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

    const profileData = await getProfileData(page);
    allData.profileImg = profileData.profileImg;
    allData.followers = profileData.followers as any;
    allData.posts = profileData.posts;
    allData.following = profileData.following;

    let prevHeight = 0;
    let currentHeight = 0;
    let reachedEnd = false;
    const allLinks = new Set<string>();

    while (!reachedEnd) {
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === prevHeight) {
        reachedEnd = true;
      } else {
        prevHeight = currentHeight;
        await page.keyboard.press('End');
        await page.waitForTimeout(10000);

        const links = await getPostLinks(page);
        console.log('Links ==>', links);
        links.forEach((link: string) => {
          if (!allLinks.has(link)) {
            allLinks.add(link);
          }
        });
      }
    }

    allData.links = Array.from(allLinks);
    await page.waitForTimeout(5000);
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
  const { server, username: proxyUsername, password } = getRandomProxy();
  console.log(`http://${server}`);
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: `http://${server}`,
      username: proxyUsername,
      password,
    },
  });
  let context = await browser.newContext();

  const page = await context.newPage();
  await loadSessionAndLogin(page);
  // Capturar los mensajes de console.log de la página
  page.on('console', (msg) => console.log(msg.text()));
  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForSelector('main');
    const data = await page.evaluate(() => {
      const deleteTags = /<[^>]*>/g;

      const mainDiv = document.querySelector('article > div');
      if (!mainDiv) return { images: '' };
      const deepDiv = mainDiv.children[1];
      if (!deepDiv) return { images: [], videos: [] };
      const imgElements = Array.from(
        mainDiv?.children[0].querySelectorAll('img')
      ).map((img) => (img as HTMLImageElement).src);
      const videoElements = Array.from(
        mainDiv?.children[0].querySelectorAll('video')
      ).map((video) => (video as HTMLVideoElement).src);
      const title = deepDiv?.children[0]?.children[1]?.children[2]
        ?.querySelector('ul')
        ?.querySelector('h1')?.innerHTML;
      const likesElement = deepDiv?.children[0]?.children[1]?.children[1]
        ?.querySelector('a')
        ?.children[0]?.querySelector('span')?.innerHTML;

      const date = deepDiv?.children[0]?.children[1]
        ?.querySelector('ul')
        ?.querySelector('li')
        ?.querySelector('time')
        ?.getAttribute('datetime');
      return {
        title: title?.replace(deleteTags, ''),
        imgElements,
        videoElements: videoElements.length > 0 ? videoElements : [''],
        datePost: date,
        likes: parseInt(likesElement as string)
          ? parseInt(likesElement as string)
          : 0,
      };
    });
    console.log('data====>', data);
    const noCommentsYet = await page.evaluate(() => {
      const noCommentsSpan = Array.from(document.querySelectorAll('span')).find(
        (span) =>
          span.textContent === 'No comments yet.' ||
          span.textContent === 'Todavía no hay comentarios.'
      );
      return noCommentsSpan !== undefined;
    });
    if (noCommentsYet) {
      const { title, imgElements, videoElements, datePost, likes } =
        data as any;
      await browser.close();
      return {
        title,
        allCom: [],
        numberOfComments: 0,
        imgElements,
        videoElements,
        datePost,
        likes,
      } as InstagramPostDetails;
    }
    const scrollUntilEnd = async () => {
      let previousScrollTop = 0;
      let canScroll: any = true;
      console.log('Entre en scrollUntilEnd');
      while (canScroll) {
        canScroll = await page.evaluate(() => {
          const mainDiv = document
            .querySelector('article > div')
            ?.children[1]?.children[0].children[1].children[2].querySelector(
              'ul'
            );
          console.log('MainDivScrol==>', mainDiv);
          const hiddenCommentsSpan = Array.from(
            document.querySelectorAll('span')
          ).find(
            (span) =>
              span.textContent === 'View hidden comments' ||
              span.textContent === 'Ver comentarios ocultos'
          );

          if (hiddenCommentsSpan) {
            mainDiv?.scrollBy(0, -1000);
            return false; // Detener el scroll si el span se encuentra
          }

          const currentScrollTop = mainDiv?.scrollTop;
          mainDiv?.scrollBy(0, 10000);

          // Devuelve el valor actual de scrollTop y si se encontró el span de comentarios ocultos
          return {
            newScrollTop: mainDiv?.scrollTop,
            hiddenCommentsSpanExists: !!hiddenCommentsSpan,
            currentScrollTop,
          };
        });

        const { newScrollTop, hiddenCommentsSpanExists, currentScrollTop } =
          canScroll as any;

        // Verifica si el scroll ha cambiado
        if (newScrollTop === currentScrollTop || hiddenCommentsSpanExists) {
          canScroll = false; // Detener el scroll si la posición no cambia o se encuentra el span
        }

        await page.waitForTimeout(2000); // Ajusta esto según tu necesidad
      }
    };

    await scrollUntilEnd();

    const commentsDivs: any[] = await page.evaluate(() => {
      const checkLikes = /(\d+)\s*(likes?|me\s+gustas?)/i;
      const deleteTags = /<[^>]*>/g;
      const ownerCommentsContainer = document
        .querySelector('article > div')
        ?.children[1]?.children[0]?.children[1]?.children[2]?.querySelector(
          'ul'
        )?.children[2];

      if (ownerCommentsContainer) {
        const allComments = Array.from(ownerCommentsContainer.children);

        let allCom = allComments.map((commentElement) => {
          const ownerElement =
            commentElement?.querySelector('span a')?.innerHTML;
          const owner = ownerElement ? ownerElement.trim() : '';
          if (commentElement.querySelector('li ul li button')) {
            const button = commentElement.querySelector(
              'li ul li button'
            ) as HTMLButtonElement;
            if (button) button.click();
          }
          const commentText = commentElement
            .querySelector('ul li')
            ?.children[0]?.children[0]?.children[1]?.children[1]?.querySelector(
              'span'
            )?.innerHTML;
          const finalComment = commentText ? commentText.trim() : '';
          const likesOfComment = commentElement
            ?.querySelector('ul')
            ?.children[0]?.querySelector('li')
            ?.children[0]?.children[0]?.children[1]?.children[2]?.querySelector(
              'button span'
            )?.innerHTML as string;
          const match = checkLikes.exec(likesOfComment);
          let likesNumber = 0;
          if (match) {
            likesNumber = parseInt(match[1], 10);
          }
          const dateOfComment =
            commentElement?.querySelector('time')?.getAttribute('datetime') ||
            '';
          console.log({
            owner,
            finalComment: finalComment.replace(deleteTags, ''),
            likesNumber,
            commentDate: dateOfComment,
          });
          return {
            owner,
            finalComment: finalComment.replace(deleteTags, ''),
            likesNumber,
            commentDate: dateOfComment,
          };
        });
        allCom = allCom.filter((comment) => comment.owner !== '');
        console.log('SOY EL ALLCOMMENTS ==>', allCom);
        return allCom;
      }
      return [];
    });

    // Si no existen respuestas a los comentarios debe retornar solamente los comentarios
    try {
      await page.waitForSelector('ul div', { timeout: 5000 });
      console.log('SUPUESTAMENTE EXISTEN RESPUESTAS A LOS COMENTARIOS');
    } catch (e) {
      const { title, datePost, imgElements, likes, videoElements } =
        data as InstagramPostDetails;
      await browser.close();
      return {
        title,
        allCom: commentsDivs,
        numberOfComments: commentsDivs.length,
        imgElements,
        videoElements,
        datePost,
        likes,
      };
    }
    const responseComments = await page.evaluate(() => {
      const deleteTags = /<[^>]*>/g;
      const mainDiv = document.querySelector('main > div > div > div');
      const ownerCommentsContainer =
        mainDiv?.children[1]?.children[0]?.children[2]?.children[0]
          ?.children[1];
      if (ownerCommentsContainer) {
        const allComments = Array.from(ownerCommentsContainer.children);

        let answerComments: any = allComments.map((commentElement: any) => {
          const ownerElement = commentElement.querySelector('span a span');
          const owner = ownerElement ? ownerElement.innerHTML.trim() : '';
          if (commentElement.children[1] !== undefined) {
            const uls = commentElement.children[1].querySelector('ul');
            const arrUls = Array.from(uls?.children || []);
            const commentText = arrUls.map((div: any) => {
              const ownerComment =
                div.children[0].children[1].children[0].children[0].children[0].children[0].querySelector(
                  'span a span'
                )?.innerHTML;
              const finalOwner = ownerComment ? ownerComment.trim() : '';
              const text =
                div.children[0].children[1].children[0].children[0].children[0]
                  .children[1].innerHTML;
              const dateOfComment =
                div.children[0].children[1].children[0].children[0].children[0].children[0]
                  .querySelector('time')
                  ?.getAttribute('datetime');
              console.log({
                originalOwnerOfCommet: owner,
                owner: finalOwner,
                finalComment: text.replace(deleteTags, ''),
                commentDate: dateOfComment,
              });
              return {
                originalOwnerOfCommet: owner,
                owner: finalOwner,
                finalComment: text.replace(deleteTags, ''),
                commentDate: dateOfComment,
              };
            });
            return commentText;
          }
        });
        answerComments = answerComments.flat();
        answerComments = answerComments.filter(
          (comment: any) => comment !== undefined
        );
        return answerComments;
      }
    });
    await page.waitForTimeout(5000);
    const { title, datePost, imgElements, likes, videoElements } = data as any;

    commentsDivs.forEach((item) => {
      item.responses = responseComments.filter(
        (response: { originalOwnerOfCommet: any }) =>
          response.originalOwnerOfCommet === item.owner
      );
    });

    await browser.close();
    return {
      title,
      allCom: commentsDivs,
      numberOfComments: commentsDivs.length,
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
export { chromium };
