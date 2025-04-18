import * as fs from 'fs';
import path from 'path';
import { Browser, BrowserContext, Page } from 'playwright';
import { UserCredentials } from '../../types/types';

const usersInstagram = './userInstagram.json';

// Función para obtener un usuario aleatorio del archivo JSON
export const getRandomUser = async () => {
  const users = JSON.parse(fs.readFileSync(usersInstagram, 'utf-8'));
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
};

export const checkForSuspicionScreen = async (page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
    const hasCloseButton = Array.from(document.querySelectorAll('button')).some(
      (button) => button.innerText === 'Cerrar'
    );
    const hasChallengeInUrl = window.location.href.includes('challenge');

    return hasCloseButton || hasChallengeInUrl;
  });
};

export const getOrCreateContext = async (
  browser: Browser,
  user: UserCredentials
): Promise<{ context: BrowserContext; isNewSession: boolean }> => {
  const sessionPath = path.resolve(
    'sessions',
    `${user.instagramUsername}_storage.json`
  );

  let context: BrowserContext;

  if (fs.existsSync(sessionPath)) {
    context = await browser.newContext({ storageState: sessionPath });
    return { context, isNewSession: false };
  } else {
    context = await browser.newContext();
    return { context, isNewSession: true };
  }
};
