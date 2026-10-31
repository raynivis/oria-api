import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { EnviarMensagemDto } from './dto/enviar-mensagem.dto';
import { SessaoResumoDto, SessaoSaidaDto } from './dto/sessao-saida.dto';
import { DialogueService } from './dialogue.service';
import { EscritorSse } from './escritor-sse';

@Controller('sessoes')
export class SessoesController {
  constructor(private readonly dialogueService: DialogueService) {}

  @Post()
  criar(
    @Body() dto: CriarSessaoDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<SessaoSaidaDto> {
    return this.dialogueService.criarSessao(usuarioAtual.id, dto);
  }

  @Get(':id')
  obter(
    @Param('id') id: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<SessaoSaidaDto> {
    return this.dialogueService.obterSessao(usuarioAtual.id, id);
  }

  /**
   * `@Sse()` do Nest só aceita GET, e este endpoint é POST: o stream é escrito
   * à mão. Se o cliente fechar a conexão antes do fim, a chamada ao LLM é
   * cancelada.
   */
  @Post(':id/mensagens')
  async enviar(
    @Param('id') sessaoId: string,
    @Body() dto: EnviarMensagemDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
    @Res() resposta: Response,
  ): Promise<void> {
    const contexto = await this.dialogueService.prepararEnvio(
      usuarioAtual.id,
      sessaoId,
      dto.conteudo,
    );

    resposta.status(200);
    resposta.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    resposta.setHeader('Cache-Control', 'no-cache');
    resposta.setHeader('Connection', 'keep-alive');
    resposta.setHeader('X-Accel-Buffering', 'no');
    resposta.flushHeaders();

    const controle = new AbortController();
    resposta.on('close', () => {
      if (!resposta.writableFinished) {
        controle.abort();
      }
    });

    await this.dialogueService.executarEnvio(contexto, new EscritorSse(resposta), controle.signal);
    resposta.end();
  }
}

@Controller('me/sessoes')
export class MeSessoesController {
  constructor(private readonly dialogueService: DialogueService) {}

  @Get()
  listar(@UsuarioAtual() usuarioAtual: UsuarioAutenticado): Promise<SessaoResumoDto[]> {
    return this.dialogueService.listarMinhas(usuarioAtual.id);
  }
}
