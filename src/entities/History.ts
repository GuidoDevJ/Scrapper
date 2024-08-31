import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from './Account';

@Entity()
export class HistoryEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  numberOfPosts: number;

  @Column()
  followers: number;

  @Column()
  following: number;

  @Column()
  userName: string;

  @Column({ type: 'timestamp' })
  scrapDate: Date;

  @ManyToOne(() => AccountEntity)
  account: AccountEntity;
}
