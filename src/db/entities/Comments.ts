import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { InstagramPost } from './InstagramPost';

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  commentOwnerName: string;

  @Column()
  comment: string;

  @Column()
  likesOfComment: number;

  @ManyToOne(() => InstagramPost, (post) => post.comments)
  post: InstagramPost;
}
