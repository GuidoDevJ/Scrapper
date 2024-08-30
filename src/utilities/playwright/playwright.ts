import { Browser, chromium, Page } from 'playwright';
import { AllData, InstagramPostDetails } from '../../types/types';
import { getRandomProxy } from '../proxyHelper';
import { loadSessionAndLogin, loginInstagram } from './loadsession';
import { getPostLinks, getProfileData } from './dataInfo';
import { randomTimeout, retryOperation } from '../optimization';
import { extractComments } from '../scrapCommentsPost';
import { scrapeData } from '../scrapPostData';
import { wait } from '../randomDelay';

const handle429 = async () => {
  const delay = randomTimeout(60000, 120000); // Espera entre 1 y 2 minutos
  console.log(
    `Recibido error 429, esperando ${delay}ms antes de reintentar...`
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
};
export const getInstagramPosts = async (
  browser: Browser,
  page: Page,
  username: string,
  user: any
): Promise<AllData> => {
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
    await page.waitForTimeout(randomTimeout(5000, 7000));
    await browser.close();
    return allData;
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error);
    await browser.close();
    throw error;
  }
};

export const getBrowserAndPage = async (user: any) => {
  // const { server, username: proxyUsername, password } = getRandomProxy() as any;

  const browser = await chromium.launch({
    // headless: false,
    // proxy: {
    //   server,
    //   username: proxyUsername,
    //   password,
    // },
  });
  let context = await browser.newContext();
  const page = await context.newPage();
  await loginInstagram(page, user, context);
  // Capturar los mensajes de console.log de la página
  page.on('console', (msg) => console.log(msg.text()));
  return {
    browser,
    page,
  };
};

export const getInstagramPostData = async (
  urls: string[],
  browser: Browser,
  page: Page
): Promise<any[]> => {
  const results = [];

  for (const link of urls) {
    try {
      await wait(180000);
      // Intentar cargar la página
      await retryOperation(page, () =>
        page.goto(link, { timeout: 100000, waitUntil: 'networkidle' })
      );
      await retryOperation(page, () => page.waitForSelector('main'));

      // Scraping de datos
      const data = await scrapeData(page);

      // Comprobar si no hay comentarios aún
      const noCommentsYet = await page.evaluate(() => {
        const noCommentsSpan = Array.from(
          document.querySelectorAll('span')
        ).find(
          (span) =>
            span.textContent === 'No comments yet.' ||
            span.textContent === 'Todavía no hay comentarios.'
        );
        return noCommentsSpan !== undefined;
      });

      if (noCommentsYet) {
        const { title, imgElements, videoElements, datePost, likes } = data;
        results.push({
          title,
          allCom: [],
          numberOfComments: 0,
          imgElements,
          videoElements,
          datePost,
          likes,
        });
        continue;
      }

      // Scroll hasta el final para cargar todos los comentarios
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

            let scrollResult = getMainDivAndScroll('article > div');
            if (!scrollResult) {
              scrollResult = getMainDivAndScroll('main > div > div > div');
            }
            return scrollResult;
          })) as any;

          const { newScrollTop, hiddenCommentsSpanExists, currentScrollTop } =
            canScroll as any;

          if (newScrollTop === currentScrollTop || hiddenCommentsSpanExists) {
            canScroll = false;
          }

          await page.waitForTimeout(randomTimeout(2000, 8000));
        }
      };

      await scrollUntilEnd();

      // Extraer comentarios
      const commentsDivs = await extractComments(page);

      // Esperar a que los comentarios estén disponibles
      try {
        await page.waitForSelector('ul div', { timeout: 5000 });
      } catch (e) {
        const { title, datePost, imgElements, likes, videoElements } = data;
        results.push({
          link,
          title,
          allCom: commentsDivs,
          numberOfComments: commentsDivs.length,
          imgElements,
          videoElements,
          datePost,
          likes,
        });
        continue;
      }

      // Evaluar respuestas a comentarios
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
                commentElement.children[0]?.children[0]?.children[0]
                  ?.children[1]?.children[0]?.children[1]?.children[0];

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

      commentsDivs.forEach((item: any) => {
        item.responses = responseComments.filter(
          (response) => response.originalOwnerOfComment === item.owner
        );
      });

      const { title, datePost, imgElements, likes, videoElements } = data;

      results.push({
        link,
        title,
        allCom: commentsDivs,
        numberOfComments: commentsDivs.length,
        imgElements,
        videoElements,
        datePost,
        likes,
      });
    } catch (error) {
      console.error(`Error fetching data for ${link}:`, error);
    }
  }

  await browser.close();
  return results;
};

export { chromium };
