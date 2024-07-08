import { DataSource, Repository } from 'typeorm';
import { InstagramPost } from '../entities/InstagramPost';

export class InstagramPostRepository {
  private instagramPostRepository: Repository<InstagramPost>;
  constructor(dataSource: DataSource) {
    this.instagramPostRepository = dataSource.getRepository(InstagramPost);
  }

  async createPost(InstagramPost: any) {
    return await this.instagramPostRepository.save(InstagramPost);
  }
}
