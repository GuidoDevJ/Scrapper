import { chromium } from 'playwright';

const scrapeTikTokProfile = async (username: string) => {
  // Inicializa el navegador
  const browser = await chromium.launch({ headless: false }); // Cambia a true si no necesitas ver la interfaz gráfica
  const context = await browser.newContext();
  const page = await context.newPage();

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
  // Cierra el navegador
  await browser.close();
};

// Ejemplo de uso
scrapeTikTokProfile('tiktokusername');
