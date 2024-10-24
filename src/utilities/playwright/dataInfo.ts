import { Page } from 'playwright';

export const getProfileData = async (page: Page) => {
  const data = await page.evaluate(() => {
    const profileImg = document.querySelector('header img') as HTMLImageElement;
    const header = document.querySelector('header') as HTMLElement;
    const liElements = header.querySelectorAll('li');
    const spans: any[] = [];

    liElements.forEach((list) => {
      const spanElement = list.querySelector('span');
      const number =
        spanElement?.getAttribute('title') ||
        spanElement?.querySelector('span')?.innerHTML;
      spans.push(number);
    });
    return {
      profileImg: profileImg.src,
      following: Number(spans[2].replace(/[,\.]/g, '')), // Elimina comas y puntos
      followers: Number(spans[1].replace(/[,\.]/g, '')), // Elimina comas y puntos
      posts: Number(spans[0].replace(/[,\.]/g, '')), // Elimina comas y puntos
    };
  });
  return data;
};

export const getPostLinks = async (page: Page) => {
  return await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return [];
    const postDivs = Array.from(
      main.querySelectorAll('div > div > div > div > div')
    );
    const linksArray = postDivs.map((postDiv) => {
      const links = postDiv.querySelectorAll('a');
      return Array.from(links).map((link) => link.href);
    });

    return linksArray.flat();
  });
};
