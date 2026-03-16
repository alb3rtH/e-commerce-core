import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { databaseConf } from './config/database';
import { OrdersModule } from './modules/order/order.module';
import { ProductsModule } from './modules/product/product.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    databaseConf,
    OrdersModule,
    UserModule,
    ProductsModule,
    AuthModule,
  ],
})
export class AppModule {}
