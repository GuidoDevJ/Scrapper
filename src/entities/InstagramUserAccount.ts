import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InstagramPost } from './InstagramPost';
import { AccountEntity } from './Account';

@Entity()
export class InstagramUserAccount {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  username: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scrapDate: string;

  @Column()
  numberOfPosts: number;

  @Column()
  followers: number;

  @Column()
  following: number;

  @Column('text', { array: true, nullable: true })
  linksPosts: string[];

  @Column({ nullable: true })
  profilePictureUrl: string;

  @OneToMany(() => InstagramPost, (post) => post.account, { nullable: true })
  posts: InstagramPost[];

  @OneToOne(() => AccountEntity)
  @JoinColumn()
  account: AccountEntity;
}
