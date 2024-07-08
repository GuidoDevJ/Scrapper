import { DataSource, Repository } from 'typeorm';
import { CommentEntity } from '../entities/Comments';

export class CommentRepository {
  private commentsRepository: Repository<CommentEntity>;
  constructor(dataSource: DataSource) {
    this.commentsRepository = dataSource.getRepository(CommentEntity);
  }
  async createComment(comment: any) {
    return await this.commentsRepository.save(comment);
  }
}
