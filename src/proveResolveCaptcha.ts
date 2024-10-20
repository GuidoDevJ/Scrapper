import { Solver } from '@2captcha/captcha-solver';
import { readFile } from 'fs/promises';
import { chromium, Page } from 'playwright';

// Utilidad para obtener un número aleatorio en un rango
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Función para cargar la página inicial
const openBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 11 });
  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, page };
};

// Función para manejar consentimiento
const handleConsent = async (page: Page) => {
  try {
    const consentButton = await page.waitForSelector(
      'body > div.fc-consent-root > div.fc-dialog-container > div.fc-dialog.fc-choice-dialog > div.fc-footer-buttons-container > div.fc-footer-buttons > button.fc-button.fc-cta-do-not-consent.fc-secondary-button',
      { timeout: 3000 }
    );
    if (consentButton) {
      await consentButton.click();
    }
  } catch (e) {
    console.log(
      'No se encontró el botón de consentimiento o no era necesario.'
    );
  }
};

// Función para resolver el captcha
const solveCaptcha = async (page: Page, solver: any) => {
  const instruction = await readFile('./imginstructions.png', {
    encoding: 'base64',
  });
  const img = (await page.evaluate(() =>
    document.querySelector('canvas')?.toDataURL()
  )) as any;

  console.log('wepp=========>', img);
  if (img.length < 2000) {
    throw new Error(
      'La imagen del CAPTCHA es demasiado pequeña o no está disponible.'
    );
  }

  const res = await solver.coordinates({
    body: img,
    textinstructions: 'Puzzle center | Центр пазла',
    imginstructions: instruction,
  });

  const offset = res.data[0].x;
  const slider = await page.$('div.slider');

  if (!slider) {
    throw new Error('No se encontró el slider para mover.');
  }

  const bb = await slider.boundingBox();
  if (!bb) {
    throw new Error('No se pudo obtener la bounding box del slider.');
  }

  const init = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
  const target = {
    x: bb.x + bb.width / 2 + parseFloat(offset) - 20,
    y: res.data[0].y,
  };

  await page.mouse.move(init.x, init.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: randomInt(50, 100) });
  await page.mouse.up();

  return res.id;
};

// Función principal de scraping
const scrapeTikTokProfile = async (username: string) => {
  const solver = new Solver('');

  const { browser, page } = await openBrowser();
  await page.goto(
    'https://www.jqueryscript.net/demo/image-puzzle-slider-captcha/',
    {
      waitUntil: 'networkidle',
    }
  );

  let success = false;

  while (!success) {
    try {
      await handleConsent(page);
      const captchaId = await solveCaptcha(page, solver);

      // Verifica si el captcha fue resuelto y navega la página
      try {
        await page.waitForNavigation({ timeout: 5000 });
        success = true;
        await solver.goodReport(captchaId); // Reporta buen captcha
        await page.screenshot({ path: 'screenshot.png' });
      } catch (e) {
        console.log('Falló la navegación, reintentando resolver el captcha.');
        await solver.badReport(captchaId); // Reporta mal captcha
      }
    } catch (error: any) {
      console.log(`Error al resolver el captcha: ${error.message}`);
    }

    // Esperar antes de reintentar
    await page.waitForTimeout(5000);
  }

  // Cerrar el navegador
  await browser.close();
};

// Ejemplo de uso
scrapeTikTokProfile('tiktokusername');
