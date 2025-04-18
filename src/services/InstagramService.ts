import { AccountEntity } from '../entities/Account';
import { InstagramUserAccount } from '../entities/InstagramUserAccount';
import { AccountRepository } from '../repositories/Account';
import { CommentRepository } from '../repositories/CommentPosts';
import { HistoryRepository } from '../repositories/History';
import { InstagramPostRepository } from '../repositories/InstagramPost';
import { UserRepository } from '../repositories/UserInstagramAccount';
import { UserCredentials } from '../types/types';
import { getRandomMilliseconds } from '../utilities/getMiliseconds';
import { getTime } from '../utilities/getTime';
import { checkForSuspicionScreen } from '../utilities/playwright/loadsession';
import {
  getBrowserAndPage,
  getInstagramPostData,
  getInstagramPosts,
} from '../utilities/playwright/playwright';
import { wait } from '../utilities/randomDelay';

export class InstagramScrapperService {
  private userRepository: UserRepository;
  private instagramPostRepository: InstagramPostRepository;
  private commentRepository: CommentRepository;
  private accountRepository: AccountRepository;
  private historyRepository: HistoryRepository;
  constructor() {
    this.userRepository = new UserRepository();
    this.instagramPostRepository = new InstagramPostRepository();
    this.commentRepository = new CommentRepository();
    this.accountRepository = new AccountRepository();
    this.historyRepository = new HistoryRepository();
  }

  async processLinks(
    links: string[],
    userEntity: InstagramUserAccount,
    user: UserCredentials
  ) {
    // Extraer las propiedades necesarias de 'data'
    let linksOfPostFinals = links.length > 10 ? links.slice(0, 10) : links;
    const { browser, page, context } = await getBrowserAndPage(user);
    const isSuspicionScreen: boolean = await checkForSuspicionScreen(page);
    // await page.waitForTimeout(3600000); // Si aparece la pantalla, hacer clic en el botón de "Cerrar"
    if (isSuspicionScreen) {
      await page.evaluate(() => {
        const closeButton = Array.from(
          document.querySelectorAll('button')
        ).find((button) => button.innerText === 'Cerrar');
        if (closeButton) closeButton.click();
      });
      await page.waitForTimeout(2000); // Esperar un momento después de cerrar
    }
    const allData = await getInstagramPostData(
      linksOfPostFinals,
      context,
      page
    );
    for (const data of allData) {
      const {
        link,
        allCom,
        title,
        likes,
        datePost,
        numberOfComments,
        imgElements,
        videoElements,
      } = data;
      try {
        // Crear una nueva publicación en Instagram
        const post = await this.instagramPostRepository.createPost({
          media: [imgElements, videoElements],
          title: title,
          numberOfLikes: typeof likes === 'string' ? +likes : likes,
          numberOfComments:
            typeof numberOfComments === 'string'
              ? +numberOfComments
              : numberOfComments,
          postDate: datePost,
          account: userEntity,
          scrapDate: getTime(),
          link,
        });

        // Procesar cada comentario de la publicación
        for (const comment of allCom) {
          // Crear un nuevo comentario
          const { finalComment, owner, commentDate, likesNumber, responses } =
            comment;
          const savedComment =
            await this.commentRepository.createCommentOrUpdate({
              comment: finalComment,
              post,
              commentOwnerName: owner,
              likesOfComment: likesNumber,
              commentDate: commentDate,
              scrapDate: getTime(),
            });
          // Verificar si el comentario tiene respuestas
          if (responses && responses.length > 0) {
            for (const response of responses) {
              const { finalComment, commentDate, owner } = response;
              // Crear y guardar cada respuesta, pasando el ID del comentario principal como FK
              await this.commentRepository.createCommentOrUpdate({
                comment: finalComment,
                post,
                commentOwnerName: owner,
                commentDate: commentDate,
                originalCommentId: savedComment,
                scrapDate: getTime(),
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing post from data ${data}:`, error);
      }
    }
    return allData;
  }

  async processPosts(
    // account: AccountEntity,
    user: UserCredentials,
    onlyOne: boolean,
    accounts: AccountEntity[]
  ) {
    const pattern = /instagram\.com\/([A-Za-z0-9._]+)/;
    console.log('Llegue hasta aqui');
    const { browser, page, context } = await getBrowserAndPage(user);
    for (const account of accounts) {
      const match = account.accountURL.match(pattern);
      if (match) {
        const username = match[1];

        const data = await getInstagramPosts(context, page, username);
        // Extraer las propiedades necesarias de 'data'
        const { links, followers, following, posts, profileImg } = data;
        // Crear un nuevo usuario
        const newUser = await this.userRepository.createUserOrUpdate({
          followers,
          following,
          numberOfPosts: posts,
          profilePictureUrl: profileImg,
          username: account.accountURL,
          account: account,
          linksPosts: links,
          scrapDate: getTime(),
        });
        await this.historyRepository.save({
          account,
          followers,
          following,
          userName: username,
          numberOfPosts: posts,
          scrapDate: getTime(),
        });
        if (posts === 0) {
          return newUser;
        }
      } else {
        console.error(
          `No se pudo extraer el nombre de usuario de la URL: ${account.accountURL}`
        );
      }
    }
    await browser.close();

    if (onlyOne) return;
    await wait(getRandomMilliseconds());
  }
  async getAllAccounts() {
    return await this.accountRepository.getAccounts();
  }
  async getAllPosts() {
    return await this.userRepository.getLinksOfPosts();
  }
  async seedAccountData(account: AccountEntity) {
    try {
      return await this.accountRepository.createAccountOrUpdate(account);
    } catch (error) {
      console.error(`Error processing account : ${account}`, error);
    }
  }
}
