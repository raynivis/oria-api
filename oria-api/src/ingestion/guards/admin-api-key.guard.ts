import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const chaveEsperada = this.configService.get<string>('ADMIN_API_KEY');
    const chaveRecebida = request.header('x-admin-api-key');

    if (!chaveEsperada || chaveRecebida !== chaveEsperada) {
      throw new UnauthorizedException('Chave de administração inválida.');
    }

    return true;
  }
}
