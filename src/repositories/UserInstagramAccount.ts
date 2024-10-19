import { Repository } from 'typeorm';
import { AppDataSource } from '../db';
import { InstagramUserAccount } from '../entities/InstagramUserAccount';

export class UserRepository {
  private repository: Repository<InstagramUserAccount>;
  constructor() {
    this.repository = AppDataSource.getRepository(InstagramUserAccount);
  }

  async createUserOrUpdate(InstagramUser: any) {
    const userExist = await this.findByUserName(InstagramUser.username);
    if (!userExist) return await this.createUser(InstagramUser);
    await this.update(InstagramUser);
    return userExist;
  }

  private async update(user: InstagramUserAccount) {
    return await this.repository
      .createQueryBuilder()
      .update(InstagramUserAccount)
      .set({ ...user })
      .where({ username: user.username })
      .execute();
  }
  private async findByUserName(username: string) {
    return await this.repository.findOne({
      where: { username },
    });
  }
  private async createUser(user: InstagramUserAccount) {
    return await this.repository.save(user);
  }
  async getLinksOfPosts() {
    return await this.repository.find({
      relations: {
        account: true,
      },
    });
  }
}
