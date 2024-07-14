import { DataSource, Repository } from 'typeorm';
import { InstagramUserAccount } from '../entities/InstagramUserAccount';

export class UserRepository {
  private repository: Repository<InstagramUserAccount>;
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(InstagramUserAccount);
  }

  async createUserOrUpdate(InstagramUser: any) {
    const userExist = await this.findByUserName(InstagramUser.username);
    console.log('USEREXIST', userExist);
    if (!userExist) return await this.createUser(InstagramUser);
    await this.update(InstagramUser);
    return userExist;
  }

  private async update(user: InstagramUserAccount) {
    console.log('ENTREEE AQUIIII', user);
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
    console.log('User ========================>', user);
    return await this.repository.save(user);
  }
}
