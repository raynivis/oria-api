import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TodasExcecoesFilter } from './common/filters/todas-excecoes.filter';

export function configurarApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new TodasExcecoesFilter());
}
