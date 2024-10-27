import { Page } from 'playwright';

export const scrapeData = async (page: Page) => {
  // Intenta extraer los datos de la primera estructura
  page.on('console', (msg) => console.log(`Browser log: ${msg.text()}`));

  let data = await page.evaluate(() => {
    const deleteTags = /<[^>]*>/g;

    const mainDiv = document.querySelector('article > div');
    if (!mainDiv) return { images: '' };
    const deepDiv = mainDiv.children[1];
    if (!deepDiv) return { images: [], videos: [] };
    const imgElements = Array.from(
      mainDiv?.children[0].querySelectorAll('img')
    ).map((img) => (img as HTMLImageElement).src);
    const videoElements = Array.from(
      mainDiv?.children[0].querySelectorAll('video')
    ).map((video) => (video as HTMLVideoElement).src);
    const title = deepDiv?.children[0]?.children[1]?.children[2]
      ?.querySelector('ul')
      ?.querySelector('h1')?.innerHTML;
    const likesElement = deepDiv?.children[0]?.children[1]?.children[1]
      ?.querySelector('a')
      ?.children[0]?.querySelector('span')?.innerHTML;
    const date = deepDiv?.children[0]?.children[1]
      ?.querySelector('ul')
      ?.querySelector('li')
      ?.querySelector('time')
      ?.getAttribute('datetime');
    return {
      title: title?.replace(deleteTags, ''),
      imgElements,
      videoElements: videoElements.length > 0 ? videoElements : [''],
      datePost: date,
      likes: parseInt(likesElement as string)
        ? parseInt(likesElement as string)
        : 0,
    };
  });

  // Si no se pudieron extraer los datos de la primera estructura, intenta con la segunda
  if (!data.title) {
    data = await page.evaluate(() => {
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
  }

  return data;
};
