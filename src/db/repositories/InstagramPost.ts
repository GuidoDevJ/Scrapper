import { DataSource, Repository } from 'typeorm';
import { InstagramPost } from '../entities/InstagramPost';

export class InstagramPostRepository {
  private instagramPostRepository: Repository<InstagramPost>;
  constructor(dataSource: DataSource) {
    this.instagramPostRepository = dataSource.getRepository(InstagramPost);
  }

  async createPost(instagramPost: any) {
    return await this.create(instagramPost);
  }
  private async create(instagramPost: any) {
    const existPost = await this.checkIfExist(
      instagramPost.title,
      instagramPost.account.id
    );
    if (existPost) return await this.updatePost(instagramPost);
    return await this.instagramPostRepository.save(instagramPost);
  }
  private async updatePost(post: InstagramPost) {
    const { account, comments, media, numberOfLikes, scrapDate, title } = post;
    // Find the post to update
    const postToUpdate = (await this.instagramPostRepository.findOneBy({
      account: account.id as any, // Aquí se filtra por el ID de la cuenta
      title: title,
    })) as any;
    postToUpdate.comments = comments;
    postToUpdate.media = media;
    postToUpdate.numberOfLikes = numberOfLikes;
    postToUpdate.scrapDate = scrapDate;
    // Update the post's properties
    postToUpdate.title = title;

    // Save the updated post
    await this.instagramPostRepository.save(postToUpdate);
    return postToUpdate;
  }

  private async checkIfExist(title: string, accountId: any) {
    return await this.instagramPostRepository.findOne({
      where: {
        title,
        account: accountId, // Aquí se filtra por el ID de la cuenta
      },
    });
  }
}
