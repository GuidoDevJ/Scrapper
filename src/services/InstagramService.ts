import { UserRepository } from '../repositories/UserInstagramAccount';
import { InstagramPostRepository } from '../repositories/InstagramPost';
import { CommentRepository } from '../repositories/CommentPosts';
import { getInstagramPostData } from '../utilities/playwright';
import { getTime } from '../utilities/getTime';
import { AccountRepository } from '../repositories/Account';
import { AccountEntity } from '../entities/Account';

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

  async processData(data: any, account: AccountEntity) {
    // // Extraer las propiedades necesarias de 'data'
    // const { links, followers, following, posts, profileImg } = data;
    // // Crear un nuevo usuario
    // const newUser = await this.userRepository.createUserOrUpdate({
    //   followers,
    //   following,
    //   numberOfPosts: posts,
    //   profilePictureUrl: profileImg,
    //   username: account.accountURL,
    //   account: account,
    //   scrapDate: getTime(),
    // });
    // if (posts === 0) {
    //   return newUser;
    // }

    const links = [
      'https://www.instagram.com/casinosdelmocona.sv/reel/C1NI7UcOqNY/',
    ];
    // // Procesar cada enlace de Instagram
    for (const link of links) {
      try {
        // Obtener datos detallados de la publicación de Instagram
        const { allCom, ...postData } = await getInstagramPostData(link);
        const { title, likes, datePost, numberOfComments } = postData;

        console.log('LLEGUE AL FINAL======>>', {
          allCom,
          postData,
        });
        // // Crear una nueva publicación en Instagram
        // const post = await this.instagramPostRepository.createPost({
        //   media: [...postData.imgElements, ...postData.videoElements],
        //   title: title,
        //   numberOfLikes: +likes,
        //   numberOfComments: +numberOfComments,
        //   postDate: datePost,
        //   account: newUser,
        //   scrapDate: getTime(),
        // });

        // // Procesar cada comentario de la publicación
        // for (const comment of allCom) {
        //   // Crear un nuevo comentario
        //   const { finalComment, owner, commentDate, likesNumber, responses } =
        //     comment;
        //   const savedComment =
        //     await this.commentRepository.createCommentOrUpdate({
        //       comment: finalComment,
        //       post,
        //       commentOwnerName: owner,
        //       likesOfComment: likesNumber,
        //       commentDate: commentDate,
        //       scrapDate: getTime(),
        //     });
        //   // Verificar si el comentario tiene respuestas
        //   if (responses && responses.length > 0) {
        //     for (const response of responses) {
        //       const { finalComment, commentDate, owner } = response;
        //       // Crear y guardar cada respuesta, pasando el ID del comentario principal como FK
        //       await this.commentRepository.createCommentOrUpdate({
        //         comment: finalComment,
        //         post,
        //         commentOwnerName: owner,
        //         commentDate: commentDate,
        //         originalCommentId: savedComment,
        //         scrapDate: getTime(),
        //       });
        //     }
        //   }
        // }
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
