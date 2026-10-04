import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AutenticacaoSaidaDto } from './dto/autenticacao-saida.dto';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registro')
  registrar(@Body() dados: RegistroDto): Promise<AutenticacaoSaidaDto> {
    return this.authService.registrar(dados);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dados: LoginDto): Promise<AutenticacaoSaidaDto> {
    return this.authService.login(dados);
  }
}
