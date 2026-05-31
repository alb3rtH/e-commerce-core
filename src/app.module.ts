import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filters';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { databaseConf } from './config/database';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    databaseConf,
    OrdersModule,
    UserModule,
    ProductModule,
    AuthModule,
    PaymentModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
