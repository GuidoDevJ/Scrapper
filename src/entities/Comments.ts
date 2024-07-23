import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InstagramPost } from './InstagramPost';

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  commentOwnerName: string;

  @Column()
  comment: string;

  @Column({ nullable: true, default: 0 })
  likesOfComment: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // Ejemplo de columna date
  scrapDate: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) // Ejemplo de columna date
  commentDate: string;

  @ManyToOne(() => InstagramPost, (post) => post.comments)
  post: InstagramPost;
  // Nueva propiedad originalCommentId para referenciar al comentario original
  @ManyToOne(() => CommentEntity, { nullable: true })
  @JoinColumn({ name: 'originalCommentId' })
  originalComment: CommentEntity;

  @Column({ nullable: true })
  originalCommentId: number;
}
