import { DataSource, Repository } from 'typeorm';
import { InstagramUserAccount } from '../entities/InstagramUserAccount';

export class UserRepository {
  private repository: Repository<InstagramUserAccount>;
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(InstagramUserAccount);
  }

  async createUser(InstagramUser: any) {
    const userExist = await this.findByUserName(InstagramUser.username);
    if (!userExist) return await this.repository.save(InstagramUser);
    throw new Error('User already exists');
  }

  async findByUserName(username: string) {
    return await this.repository.findOne({
      where: { username },
    });
  }
}
