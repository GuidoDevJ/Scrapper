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
    const { links, ...allData } = data;
    const newUser = await this.userRepository.createUser({
      followers: allData.followers,
      following: allData.following,
      numberOfPosts: allData.posts,
      profilePictureUrl: allData.profileImg,
      username: userName,
    });
    for (const link of links) {
      const { allCom, ...data } = (await getInstagramPostData(link)) as any;
      const post = await this.instagramPostRepository.createPost({
        images: data.imgElements,
        title: data.title,
        numberOfLikes: +data.likes,
        account: newUser,
      });
      for (const comment of allCom) {
        await this.commentRepository.createComment({
          comment: comment.finalComment,
          post: post,
          commentOwnerName: comment.owner,
          likesOfComment: comment.likesNumber,
        });
      }
    }
  }
}
