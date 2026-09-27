import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TodasExcecoesFilter } from './common/filters/todas-excecoes.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new TodasExcecoesFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
