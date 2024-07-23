import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AccountType } from '../types/types';

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
}