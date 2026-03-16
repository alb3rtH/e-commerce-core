import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/user/domain/user.entity';
import { Order, OrderItem } from '../modules/order/domain/order.entity';
import { Product } from '../modules/product/domain/product.entity';

export const databaseConf = TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '') || 5432,
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    entities: [User, Order, OrderItem, Product],
    synchronize: true,
    autoLoadEntities: true,
  }),
});
