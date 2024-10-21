import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from './Account';

@Entity()
export class HistoryEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    default: 0,
  })
  numberOfPosts: number;

  @Column({
    default: 0,
  })
  followers: number;

  @Column({
    default: 0,
  })
  following: number;

  @Column()
  userName: string;

  @Column({ type: 'timestamp' })
  scrapDate: Date;

  @ManyToOne(() => AccountEntity)
  account: AccountEntity;
}
