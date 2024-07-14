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

  @Column({ nullable: true })
  likesOfComment: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // Ejemplo de columna date
  scrapDate: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) // Ejemplo de columna date
  commentDate: string;

  @ManyToOne(() => InstagramPost, (post) => post.comments)
  post: InstagramPost;
}
