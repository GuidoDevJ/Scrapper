import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from './Account';
import { InstagramPost } from './InstagramPost';

@Entity()
export class InstagramUserAccount {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  username: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scrapDate: string;

  @Column({ type: 'float' }) // Cambiado a 'float' para manejar decimales
  numberOfPosts: number;

  @Column({ type: 'float' }) // Cambiado a 'float'
  followers: number;

  @Column({ type: 'float' }) // Cambiado a 'float'
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
