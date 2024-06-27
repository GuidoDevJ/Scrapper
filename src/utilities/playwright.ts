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

export const getInstagramPosts = async (username: string): Promise<AllData> => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await loadSession(page);
  const postDetails: any[] = [];
  let allData: AllData = {
    posts: 0,
    followers: 0,
    postDetails: [],
  };
  try {
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.waitForSelector('header');

    let prevHeight = 0;
    let currentHeight = 0;
    let reachedEnd = false;
    const seenImages = new Set<string>();
    // Función para realizar el scroll infinito usando la tecla "End"
    while (!reachedEnd) {
      currentHeight = await page.evaluate('document.body.scrollHeight');
      if (currentHeight === prevHeight) {
        reachedEnd = true;
      } else {
        prevHeight = currentHeight;

        // Scroll down to load more posts
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });

        // Esperar un tiempo para asegurarse de que se cargan nuevos elementos
        await page.waitForTimeout(3000);

        // Obtener los datos después del scroll
        const data: any = await page.evaluate(() => {
          // OBTENGO DATA BASICA DEL PERFIL

          const ul = document.querySelector('header ul') as HTMLElement;
          const liElements = ul.querySelectorAll('li');
          const spans: HTMLElement[] = [];

          liElements.forEach((li) => {
            const spanElements = li.querySelectorAll('span span');
            spanElements.forEach((span) => spans.push(span as HTMLElement));
          });
          if (!ul) return [];
          const article = document.querySelector('article');
          if (!article) return [];

          const postDivs = Array.from(
            article.querySelectorAll('div > div > div > div')
          );

          const spanInner = postDivs.map((postDiv) => {
            const spans = postDiv.querySelectorAll('span');
            return Array.from(spans).map((span) => span.innerHTML);
          });

          const imgArray = postDivs.map((postDiv) => {
            const imgs = postDiv.querySelectorAll('img');
            return Array.from(imgs).map((img) => img.src);
          });
          // postDetails.push(...imgArray);
          return {
            titlesOfPost: spanInner.flat(),
            imgOfPost: imgArray.flat(),
            followers: spans.map((span) => span.innerHTML)[1],
            posts: spans.map((span) => span.innerHTML)[0],
          };
        });
        allData.followers = data.followers;
        allData.posts = data.posts;
        data.titlesOfPost.forEach((title: any, index: string | number) => {
          const image = data.imgOfPost[index];
          if (!seenImages.has(image)) {
            seenImages.add(image);
            postDetails.push({ title, image });
          }
        });
      }
    }
    allData.postDetails = postDetails;
    console.log(allData);
    await browser.close();
    return allData;
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error);
    await browser.close();
    throw error;
  }
};
