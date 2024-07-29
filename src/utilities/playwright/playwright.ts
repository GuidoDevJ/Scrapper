import { chromium } from 'playwright';
import { AllData, InstagramPostDetails } from '../../types/types';
import { getRandomProxy } from '../proxyHelper';
import { loadSessionAndLogin } from './loadsession';
import { getPostLinks, getProfileData } from './dataInfo';
import { randomTimeout, retryOperation } from '../optimization';
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const handle429 = async () => {
  const delay = randomTimeout(60000, 120000); // Espera entre 1 y 2 minutos
  console.log(
    `Recibido error 429, esperando ${delay}ms antes de reintentar...`
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
};
export const getInstagramPosts = async (username: string): Promise<AllData> => {
  const { server, username: proxyUsername, password } = getRandomProxy() as any;
  const browser = await chromium.launch();
  let context = await browser.newContext();
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
    await retryOperation(page, () =>
      page.goto(`https://www.instagram.com/${username}/`)
    );
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
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(randomTimeout(5000, 15000));

        const links = await getPostLinks(page);
        links.forEach((link: string) => {
          if (!allLinks.has(link)) {
            allLinks.add(link);
          }
        });
      }
    }

    allData.links = Array.from(allLinks);
    await page.waitForTimeout(randomTimeout(5000, 10000));
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
  const { server, username: proxyUsername, password } = getRandomProxy() as any;
  const browser = await chromium.launch({
    proxy: {
      server,
      username: proxyUsername,
      password,
    },
  });
  const userAgent = getRandomUserAgent();
  console.log(`User-Agent: ${userAgent}`);
  let context = await browser.newContext({
    userAgent: userAgent,
  });
  const page = await context.newPage();
  await loadSessionAndLogin(page);

  // Capturar los mensajes de console.log de la página
  page.on('console', (msg) => console.log(msg.text()));

  try {
    await retryOperation(page, () =>
      page.goto(url, { timeout: 100000, waitUntil: 'networkidle' })
    );

    await page.waitForSelector('main');
    // // Obtener y verificar el User-Agent
    // const userAgent = await page.evaluate(() => navigator.userAgent);
    // console.log(`User-Agent utilizado: ${userAgent}`);
    // Evaluar la página con manejo de errores
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
        videoElements: videoElements.length > 0 ? videoElements : [''],
        datePost: date,
        likes: parseInt(likesHTML) ? parseInt(likesHTML) : 0,
      };
    });

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

    // Función para realizar el scroll hasta el final con manejo de errores y delays
    const scrollUntilEnd = async () => {
      let canScroll = true;

      while (canScroll) {
        canScroll = (await page.evaluate(() => {
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
            return false;
          }

          const currentScrollTop = mainDiv?.scrollTop;
          mainDiv?.scrollBy(0, 10000);

          // Devuelve el valor actual de scrollTop y si se encontró el span de comentarios ocultos
          return {
            newScrollTop: mainDiv?.scrollTop,
            hiddenCommentsSpanExists: !!hiddenCommentsSpan,
            currentScrollTop,
          };
        })) as any;

        const { newScrollTop, hiddenCommentsSpanExists, currentScrollTop } =
          canScroll as any;

        // Verifica si el scroll ha cambiado
        if (newScrollTop === currentScrollTop || hiddenCommentsSpanExists) {
          canScroll = false;
        }

        await page.waitForTimeout(randomTimeout(2000, 5000)); // Ajusta esto según tu necesidad
      }
    };

    await scrollUntilEnd();

    const commentsDivs: any[] = await page
      .evaluate(() => {
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
      })
      .catch((err) => {
        console.error(`Error extracting comments: ${err.message}`);
        return [];
      });

    try {
      await page.waitForSelector('ul div', { timeout: 5000 });
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

    const responseComments = await page
      .evaluate(() => {
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
                  div.children[0].children[1].children[0].children[0]
                    .children[0].children[1].innerHTML;
                const dateOfComment =
                  div.children[0].children[1].children[0].children[0].children[0].children[0]
                    .querySelector('time')
                    ?.getAttribute('datetime');
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
      })
      .catch((err) => {
        console.error(`Error extracting response comments: ${err.message}`);
        return [];
      });

    await page.waitForTimeout(randomTimeout(5000, 10000)); // Ajusta esto según tu necesidad

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
