import { DataSource, Repository } from 'typeorm';
import { AccountEntity } from '../entities/Account';
import { AppDataSource } from '../db';

export class AccountRepository {
  private accountRepository: Repository<AccountEntity>;

  constructor() {
    this.accountRepository = AppDataSource.getRepository(AccountEntity);
  }

  public async createAccountOrUpdate(
    account: AccountEntity
  ): Promise<AccountEntity> {
    const userExist = await this.findAndUpdate(account.accountURL);
    console.log('uUSEEE,USER', userExist);
    if (!userExist) return this.save(account);
    return userExist;
  }
  public async getAccounts(): Promise<AccountEntity[]> {
    return this.getAll();
  }

  private async save(account: AccountEntity): Promise<AccountEntity> {
    return this.accountRepository.save(account);
  }

  private async findAndUpdate(username: string) {
    return this.accountRepository.findOneBy({
      accountURL: username,
    });
  }

  private async getAll(): Promise<AccountEntity[]> {
    return this.accountRepository.find();
  }
}
