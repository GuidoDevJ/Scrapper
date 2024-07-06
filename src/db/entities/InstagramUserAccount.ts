import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InstagramPost } from './InstagramPost';

@Entity()
export class InstagramUserAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  numberOfPosts: number;

  @Column()
  followers: number;

  @Column()
  following: number;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @OneToMany(() => InstagramPost, (post) => post.account, { nullable: true })
  posts: InstagramPost[];
}
