import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InstagramPost } from './InstagramPost';

@Entity()
export class InstagramAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  username: string;

  @OneToMany(() => InstagramPost, (post) => post.account)
  posts: InstagramPost[];
}
