import { Page } from 'playwright';

// Tu función extractComments
export const extractComments = async (page: Page): Promise<any> => {
  // Escuchar eventos de consola en el navegador y mostrarlos en Node.js
  page.on('console', (msg) => console.log(`Browser log: ${msg.text()}`));

  let commentsDivs: any[] = [];
  try {
    commentsDivs = await page.evaluate(() => {
      const checkLikes = /(\d+)\s*(likes?|me\s+gustas?)/i;
      const deleteTags = /<[^>]*>/g;

      const ownerCommentsContainer1 = document
        .querySelector('article > div')
        ?.children[1]?.children[0]?.children[1]?.children[2]?.querySelector(
          'ul'
        ) as any;
      const ownerCommentsContainer2 = document.querySelector(
        'main > div > div > div'
      )?.children[1]?.children[0]?.children[2]?.children[0]?.children[1] as any;
      const ownerCommentsContainer3 = document.querySelector('ul')?.children[2]
        ?.children[0]?.children[0] as any;
      let ownerCommentsContainer: HTMLElement | null = null;
      if (ownerCommentsContainer1) {
        ownerCommentsContainer = document.querySelector('ul')?.children[2]
          ?.children[0]?.children[0] as any;
      } else if (ownerCommentsContainer2) {
        ownerCommentsContainer = ownerCommentsContainer2;
      } else if (ownerCommentsContainer3) {
        ownerCommentsContainer = ownerCommentsContainer3;
      }

      let allComments = Array.from(ownerCommentsContainer?.childNodes as any);
      const allCom = allComments.map((commentElement: any) => {
        let viewRepliesButton: HTMLElement | null = null;
        if (ownerCommentsContainer1) {
          viewRepliesButton = commentElement
            .querySelector('ul')
            ?.querySelector('ul')
            ?.querySelector('button');
        } else if (ownerCommentsContainer2) {
          viewRepliesButton =
            (commentElement?.children[1]?.querySelector('span') as any) || null;
        }

        const ownerElement = commentElement
          ?.querySelector('h3')
          .querySelector('a').innerHTML;

        // Intentar hacer clic en el botón de "ver respuestas" si está presente
        if (viewRepliesButton) {
          try {
            viewRepliesButton.click();
          } catch (error) {
            console.error(
              'No se pudo hacer clic en el botón de "ver respuestas":',
              error
            );
          }
        }

        const commentText =
          commentElement
            .querySelector('ul li')
            ?.children[0]?.children[0]?.children[1]?.children[1]?.querySelector(
              'span'
            )?.innerHTML ??
          commentElement?.children[0]?.children[0]?.children[1]?.children[0]
            ?.children[0]?.children[0]?.children[1]?.children[0]?.innerHTML;
        const finalComment = commentText ? commentText.trim() : '';

        const likesOfComment =
          commentElement
            ?.querySelector('ul')
            ?.children[0]?.querySelector('li')
            ?.children[0]?.children[0]?.children[1]?.children[2]?.querySelector(
              'button span'
            )?.innerHTML ??
          (commentElement?.children[0]?.children[0]?.children[1]?.children[0]?.children[1].querySelector(
            'span'
          )?.innerHTML as any);

        const match = checkLikes.exec(likesOfComment);
        let likesNumber = 0;
        if (match) {
          likesNumber = parseInt(match[1], 10);
        }

        const dateOfComment = commentElement
          ?.querySelector('time')
          ?.getAttribute('datetime');

        return {
          owner: ownerElement.replace(/\//g, ''),
          finalComment: finalComment.replace(deleteTags, ''),
          likesNumber,
          commentDate: dateOfComment,
        };
      });
      return allCom;
    });
    console.log('Extracted comments:', commentsDivs);
  } catch (err: any) {
    console.error(`Error extracting comments: ${err.message}`);
    return [];
  }
  return commentsDivs;
};
