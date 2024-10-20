import { Solver } from '@2captcha/captcha-solver';
import { chromium } from 'playwright';
import { getTiktoksLinks } from './utilities/playwright/dataInfo';
const scrapeTikTokProfile = async (username: string) => {
  const solver = new Solver('49ca009a143c217deef50f3143f6d1be');
  const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  // Inicializa el navegador
  const browser = await chromium.launch({ headless: false }); // Cambia a true si no necesitas ver la interfaz gráfica
  const context = await browser.newContext();
  const page = await context.newPage();
  //   await loginTiktok(page,browser, {});
  // Navega al perfil de TikTok
  const profileUrl = `https://www.tiktok.com/@midudev`;
  await page.goto(profileUrl, { waitUntil: 'networkidle' });

  // Espera que la página cargue la información del perfil
  await page.waitForSelector('[data-e2e="user-page"]');

  // Extrae la información del perfil
  const profileData = await page.evaluate(() => {
    const element = document.querySelector('[data-e2e="user-page"]');
    const img = element?.children[0]?.children[0]
      ?.querySelector('img')
      ?.getAttribute('src');
    const title =
      element?.children[0]?.children[0]?.querySelector('h1')?.textContent;
    const subtitle =
      element?.children[0]?.children[0]?.querySelector('h2')?.textContent;
    const h3 = element?.children[0]?.children[0]
      ?.querySelector('h3')
      ?.querySelectorAll('div') as any;
    const array = Array.from(h3);
    const finalMap = array.map((div: any) => {
      const strongElement = div.querySelector('strong');

      if (strongElement) {
        return strongElement.textContent;
      }
    });

    return {
      img,
      title,
      subtitle,
      following: finalMap[0],
      followers: finalMap[1],
      likes: finalMap[2],
    };
  });
  const links = await getTiktoksLinks(page);
  console.log('links=====>>>', links);
  //   let prevHeight = 0;
  //   let currentHeight = 0;
  //   let reachedEnd = false;
  //   const allLinks = new Set<string>();
  //   let iterations = 0;
  //   const maxIterations = 100; // Limite de iteraciones para evitar bucles infinitos

  //   while (!reachedEnd && iterations < maxIterations) {
  //     currentHeight = await page.evaluate(() => document.body.scrollHeight);
  //     if (currentHeight === prevHeight) {
  //       reachedEnd = true;
  //     } else {
  //       prevHeight = currentHeight;
  //       await page.evaluate(() => window.scrollBy(0, 100000));
  //       await page.waitForTimeout(randomTimeout(5000, 15000));

  //         const links = await getTiktoksLinks(page);
  //       //   links.forEach((link: string) => {
  //       //     if (!allLinks.has(link)) {
  //       //       allLinks.add(link);
  //       //     }
  //       //   });
  //     }
  //     iterations++;
  //   }

  //   allData.links = Array.from(allLinks);
  // Cierra el navegador
  await page.waitForTimeout(50000);
  await browser.close();
};

// Ejemplo de uso
scrapeTikTokProfile('tiktokusername');
