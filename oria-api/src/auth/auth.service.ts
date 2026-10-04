import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AutenticacaoSaidaDto } from './dto/autenticacao-saida.dto';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dados: RegistroDto): Promise<AutenticacaoSaidaDto> {
    const existente = await this.usersService.buscarPorEmail(dados.email);
    if (existente) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const senhaHash = await argon2.hash(dados.senha);
    const usuario = await this.usersService.criar({
      nome: dados.nome,
      email: dados.email,
      senhaHash,
    });

    return this.gerarResposta(usuario);
  }

  async login(dados: LoginDto): Promise<AutenticacaoSaidaDto> {
    const usuario = await this.usersService.buscarPorEmail(dados.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaValida = await argon2.verify(usuario.senhaHash, dados.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.gerarResposta(usuario);
  }

  private gerarResposta(usuario: User): AutenticacaoSaidaDto {
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

    return {
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        criadoEm: usuario.criadoEm,
      },
    };
  }
}
