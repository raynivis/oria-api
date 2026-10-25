import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TodasExcecoesFilter } from './common/filters/todas-excecoes.filter';

export function configurarApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const origensPermitidas = configService
    .get<string>('CORS_ORIGIN')!
    .split(',')
    .map((origem) => origem.trim());

  app.enableCors({
    origin: origensPermitidas,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new TodasExcecoesFilter());
}
