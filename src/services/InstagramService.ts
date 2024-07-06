import { DataSource } from 'typeorm';
import { UserRepository } from '../db/repositories/UserInstagramAccount';
import { InstagramUserAccount } from '../db/entities/InstagramUserAccount';
import { InstagramPostRepository } from '../db/repositories/InstagramPost';
import { CommentRepository } from '../db/repositories/CommentPosts';
import { getInstagramPostData } from '../utilities/playwright';

export class InstagramScrapperService {
  private userRepository: UserRepository;
  private instagramPostRepository: InstagramPostRepository;
  private commentRepository: CommentRepository;
  constructor(dataSource: DataSource) {
    this.userRepository = new UserRepository(dataSource);
    this.instagramPostRepository = new InstagramPostRepository(dataSource);
    this.commentRepository = new CommentRepository(dataSource);
  }

  async processData(data: any, userName: string) {
    // Extraer las propiedades necesarias de 'data'
    const { links, followers, following, posts, profileImg } = data;

    // Crear un nuevo usuario
    const newUser = await this.userRepository.createUser({
      followers,
      following,
      numberOfPosts: posts,
      profilePictureUrl: profileImg,
      username: userName,
    });

    // Procesar cada enlace de Instagram
    for (const link of links) {
      try {
        // Obtener datos detallados de la publicación de Instagram
        const { allCom, ...postData } = (await getInstagramPostData(
          link
        )) as any;

        // Crear una nueva publicación en Instagram
        const post = await this.instagramPostRepository.createPost({
          images: postData.imgElements,
          title: postData.title,
          numberOfLikes: +postData.likes,
          account: newUser,
        });

        // Procesar cada comentario de la publicación
        for (const comment of allCom) {
          // Crear un nuevo comentario
          await this.commentRepository.createComment({
            comment: comment.finalComment,
            post,
            commentOwnerName: comment.owner,
            likesOfComment: comment.likesNumber,
          });
        }
      } catch (error) {
        console.error(`Error processing post from link ${link}:`, error);
        // Puedes manejar el error de manera adecuada según tus necesidades
      }
    }
  }
}
