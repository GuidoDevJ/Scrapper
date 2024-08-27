import { UserRepository } from '../repositories/UserInstagramAccount';
import { InstagramPostRepository } from '../repositories/InstagramPost';
import { CommentRepository } from '../repositories/CommentPosts';
import {
  getBrowserAndPage,
  getInstagramPostData,
  getInstagramPosts,
} from '../utilities/playwright/playwright';
import { getTime } from '../utilities/getTime';
import { AccountRepository } from '../repositories/Account';
import { AccountEntity } from '../entities/Account';
import { getRandomMilliseconds } from '../utilities/getMiliseconds';
import { deleteSession } from '../utilities/playwright/loadsession';
import { InstagramUserAccount } from '../entities/InstagramUserAccount';
import { wait } from '../utilities/randomDelay';

export class InstagramScrapperService {
  private userRepository: UserRepository;
  private instagramPostRepository: InstagramPostRepository;
  private commentRepository: CommentRepository;
  private accountRepository: AccountRepository;
  constructor() {
    this.userRepository = new UserRepository();
    this.instagramPostRepository = new InstagramPostRepository();
    this.commentRepository = new CommentRepository();
    this.accountRepository = new AccountRepository();
  }

  async processLinks(
    links: string[],
    userEntity: InstagramUserAccount,
    user: object
  ) {
    // Extraer las propiedades necesarias de 'data'
    let linksOfPostFinals = links.length > 15 ? links.slice(0, 15) : links;
    const { browser, page } = await getBrowserAndPage(user);
    const allData = await getInstagramPostData(
      linksOfPostFinals,
      browser,
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
        // Obtener datos detallados de la publicación de Instagram
        console.log('Commets', allCom);
        // Crear una nueva publicación en Instagram
        const post = await this.instagramPostRepository.createPost({
          media: [imgElements, videoElements],
          title: title,
          numberOfLikes: +likes,
          numberOfComments: +numberOfComments,
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
    await wait(getRandomMilliseconds());
  }
  async processPosts(username: any, account: AccountEntity, user: any) {
    const { browser, page } = await getBrowserAndPage(user);
    const data = await getInstagramPosts(browser, page, username, user);

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
    if (posts === 0) {
      return newUser;
    }
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
