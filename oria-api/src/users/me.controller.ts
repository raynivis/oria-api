import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { UsersService } from './users.service';

@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async obterPerfil(@UsuarioAtual() usuarioAtual: UsuarioAutenticado) {
    const usuario = await this.usersService.buscarPorId(usuarioAtual.id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      criadoEm: usuario.criadoEm,
    };
  }
}
