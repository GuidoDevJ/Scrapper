import { chromium } from 'playwright';
import { AllData, InstagramPostDetails } from '../../types/types';
import { getRandomProxy } from '../proxyHelper';
import {
  loadSession,
  loadSessionAndLogin,
  loginInstagram,
} from './loadsession';
import { getPostLinks, getProfileData } from './dataInfo';
import { randomTimeout, retryOperation } from '../optimization';
import { extractComments } from '../scrapCommentsPost';
import { scrapeData } from '../scrapPostData';
import { getRandomUserAgent } from '../randomUsersAgents';

const handle429 = async () => {
  const delay = randomTimeout(60000, 120000); // Espera entre 1 y 2 minutos
  console.log(
    `Recibido error 429, esperando ${delay}ms antes de reintentar...`
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
};
export const getInstagramPosts = async (
  username: string,
  user: object
): Promise<AllData> => {
  const browser = await chromium.launch();
  let context = await browser.newContext();
  const page = await context.newPage();

  await loadSessionAndLogin(page, user);

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
    let iterations = 0;
    const maxIterations = 100; // Limite de iteraciones para evitar bucles infinitos

    while (!reachedEnd && iterations < maxIterations) {
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === prevHeight) {
        reachedEnd = true;
      } else {
        prevHeight = currentHeight;
        await page.evaluate(() => window.scrollBy(0, 100000));
        await page.waitForTimeout(randomTimeout(5000, 15000));

        const links = await getPostLinks(page);
        links.forEach((link: string) => {
          if (!allLinks.has(link)) {
            allLinks.add(link);
          }
        });
      }
      iterations++;
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
  url: string,
  user: any
): Promise<InstagramPostDetails> => {
  const { server, username: proxyUsername, password } = getRandomProxy() as any;
  const browser = await chromium.launch({
    // headless: false,
    proxy: {
      server,
      username: proxyUsername,
      password,
    },
  });
  const userAgent = getRandomUserAgent();

  let context = await browser.newContext({
    userAgent: userAgent,
  });

  const page = await context.newPage();

  const cookies = await loadSession(context, user);
  if (!cookies) await loginInstagram(user);
  // Añadir scripts de preload después de que la página se haya cargado

  // Capturar los mensajes de console.log de la página
  page.on('console', (msg) => console.log(msg.text()));

  try {
    await retryOperation(page, () =>
      page.goto(url, { timeout: 100000, waitUntil: 'networkidle' })
    );
    await retryOperation(page, () => page.waitForSelector('main'));
    // // Obtener y verificar el User-Agent
    // const userAgent = await page.evaluate(() => navigator.userAgent);
    // console.log(`User-Agent utilizado: ${userAgent}`);
    // Evaluar la página con manejo de errores
    const data = await scrapeData(page);
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

      const randomTimeout = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
      };

      while (canScroll) {
        canScroll = (await page.evaluate(() => {
          const getMainDivAndScroll = (selector: string) => {
            let mainDiv =
              selector === 'article > div'
                ? document
                    .querySelector(selector)
                    ?.children[1]?.children[0].children[1].children[2].querySelector(
                      'ul'
                    )
                : document.querySelector(selector)?.children[1].children[0]
                    .children[2];
            if (!mainDiv) return null;

            const hiddenCommentsSpan = Array.from(
              document.querySelectorAll('span')
            ).find(
              (span) =>
                span.textContent === 'View hidden comments' ||
                span.textContent === 'Ver comentarios ocultos'
            );

            if (hiddenCommentsSpan) {
              mainDiv.scrollBy(0, -1000);
              return {
                newScrollTop: mainDiv.scrollTop,
                hiddenCommentsSpanExists: true,
                currentScrollTop: mainDiv.scrollTop,
              };
            }

            const currentScrollTop = mainDiv.scrollTop;
            mainDiv.scrollBy(0, 10000);

            return {
              newScrollTop: mainDiv.scrollTop,
              hiddenCommentsSpanExists: !!hiddenCommentsSpan,
              currentScrollTop,
            };
          };

          // Intenta con la primera estructura
          let scrollResult = getMainDivAndScroll('article > div');

          // Si no se encuentra, intenta con la segunda estructura
          if (!scrollResult) {
            scrollResult = getMainDivAndScroll('main > div > div > div');
          }

          return scrollResult;
        })) as any;

        const { newScrollTop, hiddenCommentsSpanExists, currentScrollTop } =
          canScroll as any;

        // Verifica si el scroll ha cambiado
        if (newScrollTop === currentScrollTop || hiddenCommentsSpanExists) {
          canScroll = false; // Detener el scroll si la posición no cambia o se encuentra el span
        }

        await page.waitForTimeout(randomTimeout(2000, 8000)); // Ajusta esto según tu necesidad
      }
    };

    await scrollUntilEnd();

    const commentsDivs = (await extractComments(page)) as any;
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
    console.log('soy los comments', commentsDivs);
    const responseComments = await page.evaluate(() => {
      const deleteTags = /<[^>]*>/g;
      const ownerCommentsContainer1 = document
        .querySelector('article > div')
        ?.children[1]?.children[0]?.children[1]?.children[2]?.querySelector(
          'ul'
        )?.children[2];

      const ownerCommentsContainer2 = document.querySelector(
        'main > div > div > div'
      )?.children[1]?.children[0]?.children[2]?.children[0]?.children[1];
      const extractComments = (ownerCommentsContainer: any) => {
        if (!ownerCommentsContainer) return null;
        const allComments = Array.from(ownerCommentsContainer.children);

        return allComments
          .flatMap((commentElement: any) => {
            const ownerElement =
              commentElement.querySelector('span a') ||
              commentElement.querySelector('span a span');
            const owner = ownerElement ? ownerElement.innerHTML.trim() : '';

            if (commentElement.children[1] !== undefined) {
              const uls = commentElement.children[1].querySelector('ul');
              const arrUls = Array.from(uls?.children || []);

              return arrUls.map((div: any) => {
                const ownerComment =
                  div.querySelector('h3')?.innerHTML ||
                  div.children[0].children[1].children[0].children[0].children[0].children[0].querySelector(
                    'span a span'
                  )?.innerHTML;
                const finalOwner = ownerComment ? ownerComment.trim() : '';

                const text =
                  div.querySelector('span')?.innerHTML ||
                  div.children[0].children[1].children[0].children[0]
                    .children[0].children[1]?.innerHTML ||
                  '';

                const dateOfComment = commentElement
                  .querySelector('time')
                  ?.getAttribute('datetime');
                return {
                  originalOwnerOfComment: owner.replace(deleteTags, ''),
                  owner: finalOwner,
                  finalComment: text.replace(deleteTags, '') || '',
                  commentDate: dateOfComment,
                };
              });
            }

            let answerCommentComponent =
              commentElement.children[0]?.children[0]?.children[0]?.children[1]
                ?.children[0]?.children[1]?.children[0];
            let answerOwnerComment =
              answerCommentComponent?.querySelector('h3')?.innerHTML;
            let answerTextComment =
              answerCommentComponent?.children[0]?.children[0]?.children[1]
                ?.children[1]?.children[0]?.innerHTML;

            const commentDate = commentElement
              .querySelector('time')
              ?.getAttribute('datetime');

            return {
              originalOwnerOfComment: owner,
              owner: answerOwnerComment
                ? answerOwnerComment.replace(deleteTags, '')
                : '',
              finalComment: answerTextComment
                ? answerTextComment.replace(deleteTags, '')
                : '',
              commentDate: commentDate,
            };
          })
          .filter((comment) => comment !== undefined);
      };
      return (
        extractComments(ownerCommentsContainer1) ||
        extractComments(ownerCommentsContainer2) ||
        []
      );
    });

    await page.waitForTimeout(randomTimeout(5000, 10000)); // Ajusta esto según tu necesidad

    const { title, datePost, imgElements, likes, videoElements } = data as any;

    commentsDivs.forEach((item: any) => {
      item.responses = responseComments.filter(
        (response) => response.originalOwnerOfComment === item.owner
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
