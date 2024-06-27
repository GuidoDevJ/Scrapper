import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { InstagramAccount } from './InstagramAccount';

@Entity()
export class InstagramPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  imageUrl: string;

  @Column('int')
  likesCount: number;

  @Column('int')
  commentsCount: number;

  @ManyToOne(() => InstagramAccount, (account) => account.posts)
  account: InstagramAccount;
}
