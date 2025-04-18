import path from 'path';
import { BrowserContext, chromium, Page } from 'playwright';
import { AllData, UserCredentials } from '../../types/types';
import { randomTimeout, retryOperation } from '../optimization';
import { wait } from '../randomDelay';
import { extractComments } from '../scrapCommentsPost';
import { scrapeData } from '../scrapPostData';
import { getPostLinks, getProfileData } from './dataInfo';
import { checkForSuspicionScreen, getOrCreateContext } from './loadsession';

const handle429 = async () => {
  const delay = randomTimeout(60000, 120000); // Espera entre 1 y 2 minutos
  console.log(
    `Recibido error 429, esperando ${delay}ms antes de reintentar...`
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
};
export const getInstagramPosts = async (
  browser: BrowserContext,
  page: Page,
  username: string
): Promise<AllData> => {
  let allData: AllData = {
    posts: 0,
    followers: 0,
    following: 0,
    links: [],
    profileImg: '',
  };
  await wait(randomTimeout(3000, 6000));
  const isSuspicionScreen: boolean = await checkForSuspicionScreen(page);

  // Si aparece la pantalla, hacer clic en el botón de "Cerrar"
  if (isSuspicionScreen) {
    await page.evaluate(() => {
      const closeButton = Array.from(document.querySelectorAll('button')).find(
        (button) => button.innerText === 'Cerrar'
      );
      if (closeButton) closeButton.click();
    });
    await page.waitForTimeout(2000); // Esperar un momento después de cerrar
  }

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
    const maxLinks = 30; // Límite de enlaces a recolectar

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
        if (allLinks.size >= maxLinks) {
          reachedEnd = true;
        }
      }
      iterations++;
    }

    allData.links = Array.from(allLinks);
    await page.waitForTimeout(randomTimeout(5000, 7000));
    return allData;
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error);
    await browser.close();
    throw error;
  }
};

export const getBrowserAndPage = async (user: UserCredentials) => {
  const browser = await chromium
    .launch
    // { headless: false }
    ();

  const { context, isNewSession } = await getOrCreateContext(browser, user);

  const page = await context.newPage();

  if (isNewSession) {
    console.log('➡️ Iniciando sesión nueva para', user.instagramUsername);
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(3000);
    await page.fill('input[name="username"]', user.instagramUsername || '');
    await page.fill('input[name="password"]', user.instagramPassword || '');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(8000); // Esperar que cargue todo

    const sessionPath = path.resolve(
      'sessions',
      `${user.instagramUsername}_storage.json`
    );
    await context.storageState({ path: sessionPath });

    console.log('✅ Sesión guardada en', sessionPath);
  } else {
    console.log('🟢 Sesión cargada desde disco para', user.instagramUsername);
  }

  return { browser, page, context };
};
export const getInstagramPostData = async (
  urls: string[],
  context: BrowserContext,
  page: Page
): Promise<any[]> => {
  const results = [];
  for (const link of urls) {
    await wait(randomTimeout(3000, 6000));
    try {
      // Intentar cargar la página
      await retryOperation(page, () =>
        page.goto(link, { timeout: 100000, waitUntil: 'networkidle' })
      );
      const isSuspicionScreen: boolean = await checkForSuspicionScreen(page);

      // Si aparece la pantalla, hacer clic en el botón de "Cerrar"
      if (isSuspicionScreen) {
        await page.evaluate(() => {
          const closeButton = Array.from(
            document.querySelectorAll('button')
          ).find((button) => button.innerText === 'Cerrar');
          if (closeButton) closeButton.click();
        });
        await page.waitForTimeout(2000); // Esperar un momento después de cerrar
      }

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
      page.on('console', (msg) => console.log(`Browser log: ${msg.text()}`));

      const scrollUntilEnd = async () => {
        let canScroll = true;

        const randomTimeout = (min: number, max: number) => {
          return Math.floor(Math.random() * (max - min + 1) + min);
        };

        while (canScroll) {
          const scrollResult = await page.evaluate(() => {
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

              // Buscar el botón de cargar más comentarios
              const loadMoreButton = document.querySelector(
                'svg[aria-label*="Cargar más comentarios"]'
              );

              if (loadMoreButton) {
                const buttonElement = loadMoreButton.closest('button'); // Obtener el botón padre del SVG
                if (buttonElement) {
                  buttonElement.click(); // Hacer clic en el botón
                }
                mainDiv.scrollBy(0, 10000); // Desplazar para cargar más
                return {
                  newScrollTop: mainDiv.scrollTop,
                  buttonClicked: true,
                  currentScrollTop: mainDiv.scrollTop,
                };
              }

              // Si no hay botón, solo sigue desplazando
              const currentScrollTop = mainDiv.scrollTop;
              mainDiv.scrollBy(0, 10000);
              return {
                newScrollTop: mainDiv.scrollTop,
                buttonClicked: false, // No hay botón para hacer clic
                currentScrollTop,
              };
            };

            let scrollResult = getMainDivAndScroll('article > div');
            if (!scrollResult) {
              scrollResult = getMainDivAndScroll('main > div > div > div');
            }
            return scrollResult;
          });

          const { newScrollTop, buttonClicked, currentScrollTop } =
            scrollResult as any;

          // Si el scroll no cambió o no hay botón para hacer clic, termina
          if (newScrollTop === currentScrollTop && !buttonClicked) {
            canScroll = false;
          }

          // Esperar antes de hacer otro intento
          await page.waitForTimeout(randomTimeout(2000, 5000));
        }
      };

      await scrollUntilEnd();

      // Extraer comentarios
      const commentsDivs = await extractComments(page);
      console.log('Soy los commentsDivs', commentsDivs);

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

  await context.close();
  return results;
};

export { chromium };
