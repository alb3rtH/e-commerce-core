import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { databaseConf } from './config/database';
import { OrdersModule } from './modules/order/order.module';
import { ProductsModule } from './modules/product/product.module';

@Module({
  imports: [databaseConf, OrdersModule, UserModule, ProductsModule],
})
export class AppModule {}
