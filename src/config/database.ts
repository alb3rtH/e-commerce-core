import { TypeOrmModule } from '@nestjs/typeorm';

export const databaseConf = TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'test',
  entities: [],
  synchronize: true,
});
