import { Page } from 'playwright';
import { randomDelay } from './randomDelay';

export const scrollUntilEnd = async (page: Page) => {
  let previousScrollTop = 0;
  let canScroll: any = true;
  console.log('Entre en scrollUntilEnd');
  while (canScroll) {
    canScroll = await page.evaluate(() => {
      const mainDiv1 = document
        .querySelector('article > div')
        ?.children[1]?.children[0].children[1].children[2].querySelector('ul');
      const mainDiv2 = document.querySelector('main > div > div > div')
        ?.children[1].children[0].children[2];

      let mainDiv: Element | null = null;
      if (mainDiv1) {
        mainDiv = mainDiv1;
      } else if (mainDiv2) {
        mainDiv = mainDiv2;
      }

      console.log('MainDivScroll==>', mainDiv);
      const hiddenCommentsSpan = Array.from(
        document.querySelectorAll('span')
      ).find(
        (span) =>
          span.textContent === 'View hidden comments' ||
          span.textContent === 'Ver comentarios ocultos'
      );

      if (hiddenCommentsSpan) {
        mainDiv?.scrollBy(0, -1000);
        return false; // Detener el scroll si el span se encuentra
      }

      const currentScrollTop = mainDiv?.scrollTop;
      mainDiv?.scrollBy(0, 10000);

      // Devuelve el valor actual de scrollTop y si se encontró el span de comentarios ocultos
      return {
        newScrollTop: mainDiv?.scrollTop,
        hiddenCommentsSpanExists: !!hiddenCommentsSpan,
        currentScrollTop,
      };
    });

    const { newScrollTop, hiddenCommentsSpanExists, currentScrollTop } =
      canScroll as any;

    // Verifica si el scroll ha cambiado
    if (newScrollTop === currentScrollTop || hiddenCommentsSpanExists) {
      canScroll = false; // Detener el scroll si la posición no cambia o se encuentra el span
    }

    await page.waitForTimeout(5000); // Ajusta esto según tu necesidad
  }
};
