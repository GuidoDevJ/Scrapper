import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { InstagramUserAccount } from './InstagramUserAccount';
import { CommentEntity } from './Comments';
import { TypesOfContentSocialMedia } from '../types/types';

@Entity()
export class InstagramPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  link: string;
  @Column({ type: 'simple-array' })
  media: string[];

  @Column()
  title: string;

  @Column({ nullable: true })
  numberOfLikes: number;

  @Column({ nullable: true })
  numberOfComments: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scrapDate: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  postDate: string;

  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments: CommentEntity[];

  @ManyToOne(() => InstagramUserAccount, (account) => account.posts)
  account: InstagramUserAccount;
  @Column({
    type: 'enum',
    enum: TypesOfContentSocialMedia,
    default: TypesOfContentSocialMedia.INSTAGRAM,
  })
  type: TypesOfContentSocialMedia;
}
