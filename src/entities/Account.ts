import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AccountType } from '../types/types';

enum Enabled {
  ENABLED = 1,
  DISABLED = 0,
}
@Entity()
export class AccountEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  accountURL: string;

  @Column({
    enum: AccountType,
    default: AccountType.INSTAGRAM,
  })
  accountType: AccountType;

  @Column({
    type: 'enum',
    enum: Enabled,
    default: Enabled.ENABLED,
  })
  enabled: Enabled;
}
