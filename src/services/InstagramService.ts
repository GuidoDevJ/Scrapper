import { DataSource } from 'typeorm';
import { UserRepository } from '../db/repositories/UserInstagramAccount';
import { InstagramPostRepository } from '../db/repositories/InstagramPost';
import { CommentRepository } from '../db/repositories/CommentPosts';
import { getInstagramPostData } from '../utilities/playwright';
import { getTime } from '../utilities/getTime';
import { AccountRepository } from '../db/repositories/Account';
import { AccountEntity } from '../db/entities/Account';

export class InstagramScrapperService {
  private userRepository: UserRepository;
  private instagramPostRepository: InstagramPostRepository;
  private commentRepository: CommentRepository;
  private accountRepository: AccountRepository;
  constructor(dataSource: DataSource) {
    this.userRepository = new UserRepository(dataSource);
    this.instagramPostRepository = new InstagramPostRepository(dataSource);
    this.commentRepository = new CommentRepository(dataSource);
    this.accountRepository = new AccountRepository(dataSource);
  }

  async processData(data: any, account: AccountEntity) {
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
      scrapDate: getTime(),
    });
    if (posts === 0) {
      return newUser;
    }

    // // Procesar cada enlace de Instagram
    for (const link of links) {
      try {
        // Obtener datos detallados de la publicación de Instagram
        const { allCom, ...postData } = await getInstagramPostData(link);
        console.log('ALL COMMETS ===>', allCom);
        // Crear una nueva publicación en Instagram
        const post = await this.instagramPostRepository.createPost({
          media: [...postData.imgElements, ...postData.videoElements],
          title: postData.title,
          numberOfLikes: +postData.likes,
          postDate: postData.datePost,
          account: newUser,
          scrapDate: getTime(),
        });

        // Procesar cada comentario de la publicación
        for (const comment of allCom) {
          // Crear un nuevo comentario
          const savedComment =
            await this.commentRepository.createCommentOrUpdate({
              comment: comment.finalComment,
              post,
              commentOwnerName: comment.owner,
              likesOfComment: comment.likesNumber,
              commentDate: comment.commentDate,
              scrapDate: getTime(),
            });
          // Verificar si el comentario tiene respuestas
          if (comment.responses && comment.responses.length > 0) {
            for (const response of comment.responses) {
              // Crear y guardar cada respuesta, pasando el ID del comentario principal como FK
              await this.commentRepository.createCommentOrUpdate({
                comment: response.finalComment,
                post,
                commentOwnerName: response.owner,
                commentDate: response.commentDate,
                originalCommentId: savedComment,
                scrapDate: getTime(),
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing post from link ${link}:`, error);
        // Puedes manejar el error de manera adecuada según tus necesidades
      }
    }
  }
  async getAllAccounts() {
    return await this.accountRepository.getAccounts();
  }
  async seedAccountData(account: AccountEntity) {
    try {
      return await this.accountRepository.createAccountOrUpdate(account);
    } catch (error) {
      console.error(`Error processing account : ${account}`, error);
    }
  }
}
