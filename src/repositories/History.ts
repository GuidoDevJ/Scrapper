import { Repository } from 'typeorm';
import { AppDataSource } from '../db';
import { HistoryEntity } from '../entities/History';

export class HistoryRepository {
  private historyRepository: Repository<HistoryEntity>;

  constructor() {
    this.historyRepository = AppDataSource.getRepository(HistoryEntity);
  }

  async save(historyAccount: HistoryEntity): Promise<HistoryEntity> {
    return this.historyRepository.save(historyAccount);
  }
}
