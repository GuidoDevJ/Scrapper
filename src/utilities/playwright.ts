import { Page, chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { AllData, InstagramPostDetails } from '../types/types';
import { envs } from '../config';
const sessionFilePath = './sessionCookies.json';

// Función para guardar las cookies en un archivo
async function saveSession(context: any) {
  const cookies = await context.cookies();
  fs.writeFileSync(sessionFilePath, JSON.stringify(cookies, null, 2));
  console.log('Cookies guardadas:', cookies);
}

// Función para cargar las cookies desde un archivo
async function loadSession(context: any) {
  if (fs.existsSync(sessionFilePath)) {
    const cookies = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    for (const cookie of cookies) {
      await context.addCookies([cookie]);
    }
    console.log('Cookies cargadas:', cookies);
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
  await page.fill('input[name="username"]', envs.instagramUsername || '');
  await page.fill('input[name="password"]', envs.instagramPassword || '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000); // Ajusta esto según tu necesidad
  await saveSession(page.context());
};

// Función principal para cargar sesión e iniciar sesión si es necesario
const loadSessionAndLogin = async (page: Page) => {
  const context = page.context();
  const cookies = await loadSession(context);

  await page.goto('https://www.instagram.com');

  // Esperar un selector que indique que la sesión es válida
  const loginForm = await page.$('form');
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
  const browser = await chromium.launch({
    headless: false, // Establece la opción headless a true
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
    headless: false, // Establece la opción headless a true
  });
  const page = await browser.newPage();
  await loadSessionAndLogin(page);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('main');
    const data = await page.evaluate(() => {
      const deleteTags = /<[^>]*>/g;

      const mainDiv = document.querySelector('main > div > div > div');
      if (!mainDiv) return { images: '' };
      const deepDiv = mainDiv.querySelector('div > div > div');
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
    const noCommentsYet = await page.evaluate(() => {
      const noCommentsSpan = Array.from(document.querySelectorAll('span')).find(
        (span) => span.textContent === 'No comments yet.'
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
        imgElements,
        videoElements,
        datePost,
        likes,
      } as InstagramPostDetails;
    }
    const scrollUntilEnd = async () => {
      let canScroll = true;
      while (canScroll) {
        canScroll = await page.evaluate(() => {
          const mainDiv = document.querySelector('main > div > div > div')
            ?.children[1].children[0].children[2];

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
          // if (mainDiv) {
          //   const previousScrollTop = mainDiv.scrollTop;
          //   mainDiv.scrollBy(0, 10000);
          //   const newScrollTop = mainDiv.scrollTop;
          //   return newScrollTop > previousScrollTop;
          // }
          if (!hiddenCommentsSpan) {
            mainDiv?.scrollBy(0, 10000);
            return !hiddenCommentsSpan;
          }
          return false;
        });
        await page.waitForTimeout(5000);
      }
    };
    await scrollUntilEnd();

    const commentsDivs: any[] = await page.evaluate(() => {
      const checkLikes = /(\d+)\s*(likes?|me\s+gustas?)/i;
      const deleteTags = /<[^>]*>/g;
      const mainDiv = document.querySelector('main > div > div > div');
      const ownerCommentsContainer =
        mainDiv?.children[1]?.children[0]?.children[2]?.children[0]
          ?.children[1];
      if (ownerCommentsContainer) {
        const allComments = Array.from(ownerCommentsContainer.children);

        let allCom = allComments.map((commentElement) => {
          const ownerElement = commentElement.querySelector('span a span');
          const owner = ownerElement ? ownerElement.innerHTML.trim() : '';
          if (commentElement.children[1]) {
            const span = commentElement.children[1].querySelector('span');
            if (span) span.click();
          }
          const commentText =
            commentElement?.children[0]?.children[0]?.children[1]?.children[0]
              ?.children[0]?.children[0]?.children[1]?.children[0]?.innerHTML;
          const finalComment = commentText ? commentText.trim() : '';
          const likesOfComment =
            commentElement?.children[0]?.children[0]?.children[1]?.children[0]?.children[1].querySelector(
              'span'
            )?.innerHTML as string;
          const match = checkLikes.exec(likesOfComment);
          let likesNumber = 0;
          if (match) {
            likesNumber = parseInt(match[1], 10);
          }
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
      imgElements,
      videoElements,
      datePost,
      likes,
    } as unknown as InstagramPostDetails;
  } catch (error) {
    console.error(`Error fetching data for ${url}:`, error);
    await browser.close();
    throw error;
  }
};
