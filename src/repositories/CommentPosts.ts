import { DataSource, Repository } from 'typeorm';
import { CommentEntity } from '../entities/Comments';
import { AppDataSource } from '../db/index';

export class CommentRepository {
  private commentsRepository: Repository<CommentEntity>;
  constructor() {
    this.commentsRepository = AppDataSource.getRepository(CommentEntity);
  }
  async createCommentOrUpdate(comment: any) {
    const existComment = await this.checkIfExist(
      comment.comment,
      comment.postId
    );
    if (existComment) return await this.updateComment(comment);
    return await this.createComment(comment);
  }
  private async updateComment(commet: any) {
    const { comment, postId, likesOfComment } = commet;
    // Find the post to update
    const postToUpdate = (await this.commentsRepository.findOneBy({
      comment: comment,
      post: postId as any, // Aquí se filtra por el ID de la cuenta
    })) as any;
    // Update the post's properties
    postToUpdate.comment = comment;
    postToUpdate.likesOfComment = likesOfComment;
    // Save the updated post
    await this.commentsRepository.save(postToUpdate);
  }
  private async createComment(comment: any) {
    return await this.commentsRepository.save(comment);
  }
  private async checkIfExist(comment: string, postId: any) {
    return await this.commentsRepository.findOneBy({
      comment,
      post: postId as any, // Aquí se filtra por el ID de la cuenta
    });
  }
}
