import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { InstagramUserAccount } from './InstagramUserAccount';
import { CommentEntity } from './Comments';

@Entity()
export class InstagramPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-array' })
  images: string[];

  @Column()
  title: string;

  @Column({ nullable: true })
  numberOfLikes: number;

  // @OneToMany(() => CommentEntity, (comment) => comment.post)
  // comments: CommentEntity[];

  @ManyToOne(() => InstagramUserAccount, (account) => account.posts)
  account: InstagramUserAccount;
  comments: any;
}
