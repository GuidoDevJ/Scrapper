import { DataSource } from 'typeorm';
import { envs } from '../config';
import { AccountEntity } from '../entities/Account';
import { CommentEntity } from '../entities/Comments';
import { InstagramPost } from '../entities/InstagramPost';
import { InstagramUserAccount } from '../entities/InstagramUserAccount';
import { HistoryEntity } from '../entities/History';
export const AppDataSource = new DataSource({
  type: envs.dbName as any,
  host: envs.dbHost,
  port: +envs.dbPort,
  username: envs.dbUser,
  password: envs.dbPassword,
  database: envs.dbName,
  logging: false,
  synchronize: true,
  entities: [
    AccountEntity,
    CommentEntity,
    InstagramPost,
    InstagramUserAccount,
    HistoryEntity,
  ],
});
