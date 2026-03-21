import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

const PORT_APP = process.env.PORT || 3000;

(() => {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const docConfig = new DocumentBuilder()
      .setTitle('e-commerce-core')
      .setVersion('0.0.1')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('doc', app, documentFactory);

    await app.setGlobalPrefix('api/v1').listen(PORT_APP);

    new Logger().debug(`the is listen in http://localhost:${PORT_APP}`);
  }
  bootstrap().catch((err) => console.log(err));
})();
