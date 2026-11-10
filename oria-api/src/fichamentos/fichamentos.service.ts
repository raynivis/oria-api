import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { diffChars } from 'diff';
import { IsNull, Repository } from 'typeorm';
import { Book } from '../catalog/entities/book.entity';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import {
  VERSAO as VERSAO_FICHAMENTO,
  schemaFichamento,
} from '../prompts/templates/fichamento';
import { EditarFichamentoDto } from './dto/editar-fichamento.dto';
import { FichamentoResumoDto } from './dto/fichamento-resumo.dto';
import { FichamentoSaidaDto } from './dto/fichamento-saida.dto';
import { FichamentoVersaoSaidaDto } from './dto/fichamento-versao-saida.dto';
import { GerarFichamentoDto } from './dto/gerar-fichamento.dto';
import { Fichamento } from './entities/fichamento.entity';
import { FichamentoVersao } from './entities/fichamento-versao.entity';
import { FILA_FICHAMENTO, FichamentoJobData } from './fichamentos.constants';

const CODIGO_VIOLACAO_UNICIDADE_POSTGRES = '23505';
const TAMANHO_PREVIEW_TRECHO = 160;
const RELACOES_SAIDA = ['versoes', 'secao', 'secao.livro'];

@Injectable()
export class FichamentosService {
  constructor(
    @InjectRepository(Fichamento)
    private readonly fichamentosRepository: Repository<Fichamento>,
    @InjectRepository(FichamentoVersao)
    private readonly versoesRepository: Repository<FichamentoVersao>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
    @InjectQueue(FILA_FICHAMENTO)
    private readonly filaFichamento: Queue<FichamentoJobData>,
  ) {}

  /**
   * Sem `trechoCfi`/`trechoTexto`, gera o fichamento da seção inteira. Com
   * ambos, gera uma ficha ancorada naquele recorte — mesmo endpoint, mesmo
   * prompt, recebendo o trecho em vez do texto completo (IMPLEMENTATION.md,
   * Fase 5; SCENARIOS.md, divergência 4). Idempotente por
   * (userId, sectionId, trechoCfi): uma segunda chamada com o mesmo recorte
   * devolve o fichamento já gerado, sem chamar o LLM de novo.
   */
  async gerarOuObter(
    userId: string,
    sectionId: string,
    dto: GerarFichamentoDto,
  ): Promise<FichamentoSaidaDto> {
    const trechoCfi = dto.trechoCfi ?? null;

    const existente = await this.fichamentosRepository.findOne({
      where: { userId, sectionId, trechoCfi: trechoCfi ?? IsNull() },
      relations: RELACOES_SAIDA,
    });
    if (existente) {
      return this.paraSaida(existente);
    }

    const secao = await this.sectionsRepository.findOne({
      where: { id: sectionId },
      relations: ['livro'],
    });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const resultado = await this.llmService.completar(
      'fichamento',
      {
        tituloSecao: secao.titulo,
        texto: dto.trechoTexto ?? secao.textoCompleto,
      },
      schemaFichamento,
    );

    const modelo = this.configService.get<string>('LLM_FICHAMENTO_MODEL')!;

    try {
      const fichamento = await this.fichamentosRepository.save(
        this.fichamentosRepository.create({
          userId,
          sectionId,
          trechoCfi,
          trechoTexto: dto.trechoTexto ?? null,
          statusGeracao: 'pronto',
        }),
      );
      const versao = await this.versoesRepository.save(
        this.versoesRepository.create({
          fichamentoId: fichamento.id,
          numero: 1,
          conteudo: resultado.conteudo,
          origem: 'ia',
          promptVersao: VERSAO_FICHAMENTO,
          modelo,
        }),
      );
      fichamento.versoes = [versao];
      fichamento.secao = secao;
      return this.paraSaida(fichamento);
    } catch (erro) {
      // Duas requisições concorrentes pedindo o mesmo (seção, trecho) na
      // primeira chamada: a segunda esbarra no unique e só precisa devolver
      // o que a primeira já gravou, não falhar.
      if (this.ehViolacaoDeUnicidade(erro)) {
        const jaGravado = await this.fichamentosRepository.findOne({
          where: { userId, sectionId, trechoCfi: trechoCfi ?? IsNull() },
          relations: RELACOES_SAIDA,
        });
        if (jaGravado) {
          return this.paraSaida(jaGravado);
        }
      }
      throw erro;
    }
  }

  /**
   * Item 2.5 (correção de usabilidade): mesma idempotência de `gerarOuObter`,
   * mas a geração acontece no `FichamentosProcessor`, fora da requisição — a
   * geração que excedeu 180s na demonstração concluiu no servidor, foi o
   * cliente que desistiu. Devolve a ficha já com `statusGeracao:'pendente'`;
   * o chamador consulta `GET /fichamentos/:id` (já existente) até virar
   * `'pronto'`.
   */
  async gerarOuObterAssincrono(
    userId: string,
    sectionId: string,
    dto: GerarFichamentoDto,
  ): Promise<FichamentoSaidaDto> {
    const trechoCfi = dto.trechoCfi ?? null;

    const existente = await this.fichamentosRepository.findOne({
      where: { userId, sectionId, trechoCfi: trechoCfi ?? IsNull() },
      relations: RELACOES_SAIDA,
    });
    if (existente) {
      return this.paraSaida(existente);
    }

    const secao = await this.sectionsRepository.findOne({
      where: { id: sectionId },
      relations: ['livro'],
    });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    try {
      const fichamento = await this.fichamentosRepository.save(
        this.fichamentosRepository.create({
          userId,
          sectionId,
          trechoCfi,
          trechoTexto: dto.trechoTexto ?? null,
          statusGeracao: 'pendente',
        }),
      );
      fichamento.secao = secao;
      fichamento.versoes = [];
      await this.filaFichamento.add('gerar', { fichamentoId: fichamento.id });
      return this.paraSaida(fichamento);
    } catch (erro) {
      if (this.ehViolacaoDeUnicidade(erro)) {
        const jaGravado = await this.fichamentosRepository.findOne({
          where: { userId, sectionId, trechoCfi: trechoCfi ?? IsNull() },
          relations: RELACOES_SAIDA,
        });
        if (jaGravado) {
          return this.paraSaida(jaGravado);
        }
      }
      throw erro;
    }
  }

  async obterPorId(userId: string, id: string): Promise<FichamentoSaidaDto> {
    const fichamento = await this.buscarDoAluno(userId, id);
    return this.paraSaida(fichamento);
  }

  /**
   * `PATCH` nunca atualiza `conteudo` de uma versão existente: sempre insere
   * uma `FichamentoVersao` nova com `numero = max + 1` e `origem = 'aluno'`.
   * Um `UPDATE` aqui destruiria o dado de pesquisa (CLAUDE.md regra 3).
   */
  async editar(
    userId: string,
    id: string,
    dto: EditarFichamentoDto,
  ): Promise<FichamentoSaidaDto> {
    const fichamento = await this.buscarDoAluno(userId, id);
    const versoes = fichamento.versoes ?? [];
    const proximoNumero = Math.max(...versoes.map((v) => v.numero)) + 1;

    const novaVersao = await this.versoesRepository.save(
      this.versoesRepository.create({
        fichamentoId: fichamento.id,
        numero: proximoNumero,
        conteudo: dto.conteudo,
        origem: 'aluno',
      }),
    );

    fichamento.versoes = [...versoes, novaVersao];
    await this.fichamentosRepository.save(fichamento);
    return this.paraSaida(fichamento);
  }

  async listarVersoes(
    userId: string,
    id: string,
  ): Promise<FichamentoVersaoSaidaDto[]> {
    const fichamento = await this.buscarDoAluno(userId, id);
    return (fichamento.versoes ?? [])
      .slice()
      .sort((a, b) => a.numero - b.numero)
      .map((versao) => ({
        numero: versao.numero,
        conteudo: versao.conteudo,
        origem: versao.origem,
        promptVersao: versao.promptVersao,
        modelo: versao.modelo,
        criadoEm: versao.criadoEm,
      }));
  }

  async remover(userId: string, id: string): Promise<void> {
    const fichamento = await this.buscarDoAluno(userId, id);
    await this.fichamentosRepository.remove(fichamento);
  }

  /** Item 2.6 (correção de usabilidade): filtro exato por seção e busca
   * textual (case-insensitive) sobre o conteúdo atual e o trecho original. */
  async listarMeus(
    userId: string,
    livroId?: string,
    sectionId?: string,
    texto?: string,
  ): Promise<FichamentoResumoDto[]> {
    const fichamentos = await this.carregarComSecaoELivro(userId, livroId, sectionId, texto);
    return fichamentos.map((fichamento) => this.paraResumo(fichamento));
  }

  async exportarMarkdown(userId: string): Promise<string> {
    const fichamentos = await this.carregarComSecaoELivro(userId);
    return fichamentos.map((fichamento) => this.montarBlocoMarkdown(fichamento)).join('\n\n---\n\n');
  }

  /** Item 2.9 (correção de usabilidade): mesma montagem de bloco do
   * exportador em massa, escopada a uma única ficha. */
  async exportarMarkdownUnico(userId: string, id: string): Promise<string> {
    const fichamento = await this.buscarDoAluno(userId, id);
    return this.montarBlocoMarkdown(fichamento);
  }

  private montarBlocoMarkdown(fichamento: Fichamento): string {
    const secao = fichamento.secao!;
    const ultimaVersao = this.ultimaVersao(fichamento);
    const titulo = fichamento.trechoCfi
      ? `${secao.titulo} — trecho ${fichamento.trechoCfi}`
      : secao.titulo;
    return `# ${secao.livro!.titulo}\n\n## ${titulo}\n\n${ultimaVersao.conteudo}`;
  }

  private async carregarComSecaoELivro(
    userId: string,
    livroId?: string,
    sectionId?: string,
    texto?: string,
  ): Promise<Array<Fichamento & { secao: Section & { livro: Book } }>> {
    const fichamentos = await this.fichamentosRepository.find({
      where: { userId },
      relations: RELACOES_SAIDA,
      order: { atualizadoEm: 'DESC' },
    });

    let filtrados = fichamentos.filter(
      (f): f is Fichamento & { secao: Section & { livro: Book } } => f.secao !== undefined,
    );

    if (livroId) {
      filtrados = filtrados.filter((f) => f.secao.bookId === livroId);
    }
    if (sectionId) {
      filtrados = filtrados.filter((f) => f.sectionId === sectionId);
    }
    if (texto) {
      const agulha = texto.toLowerCase();
      filtrados = filtrados.filter((f) => {
        const conteudoAtual = this.ultimaVersao(f).conteudo.toLowerCase();
        const trecho = (f.trechoTexto ?? '').toLowerCase();
        return conteudoAtual.includes(agulha) || trecho.includes(agulha);
      });
    }

    return filtrados;
  }

  private paraResumo(
    fichamento: Fichamento & { secao: Section & { livro: Book } },
  ): FichamentoResumoDto {
    const ultimaVersao = this.ultimaVersao(fichamento);
    return {
      id: fichamento.id,
      sectionId: fichamento.sectionId,
      tituloSecao: fichamento.secao.titulo,
      livroId: fichamento.secao.bookId,
      tituloLivro: fichamento.secao.livro.titulo,
      trechoCfi: fichamento.trechoCfi ?? null,
      origemVersaoAtual: ultimaVersao.origem,
      editado: (fichamento.versoes ?? []).some((v) => v.origem === 'aluno'),
      atualizadoEm: fichamento.atualizadoEm,
      criadoEm: fichamento.criadoEm,
      trechoPreview: fichamento.trechoTexto
        ? fichamento.trechoTexto.slice(0, TAMANHO_PREVIEW_TRECHO)
        : null,
    };
  }

  private async buscarDoAluno(
    userId: string,
    id: string,
  ): Promise<Fichamento> {
    const fichamento = await this.fichamentosRepository.findOne({
      where: { id, userId },
      relations: RELACOES_SAIDA,
    });
    if (!fichamento) {
      throw new NotFoundException('Fichamento não encontrado.');
    }
    return fichamento;
  }

  private ehViolacaoDeUnicidade(erro: unknown): boolean {
    return (
      typeof erro === 'object' &&
      erro !== null &&
      'driverError' in erro &&
      (erro as { driverError?: { code?: string } }).driverError?.code ===
        CODIGO_VIOLACAO_UNICIDADE_POSTGRES
    );
  }

  private ultimaVersao(fichamento: Fichamento): FichamentoVersao {
    const versoes = fichamento.versoes ?? [];
    if (versoes.length === 0) {
      // Item 2.5: ficha com geração pendente/com erro ainda não tem versão —
      // placeholder seguro em vez de `reduce` num array vazio.
      return {
        id: '',
        fichamentoId: fichamento.id,
        numero: 0,
        conteudo: '',
        origem: 'ia',
        criadoEm: fichamento.criadoEm,
      } as FichamentoVersao;
    }
    return versoes.reduce((maior, atual) =>
      atual.numero > maior.numero ? atual : maior,
    );
  }

  private primeiraVersaoIa(fichamento: Fichamento): FichamentoVersao | null {
    const versoesIa = (fichamento.versoes ?? []).filter(
      (v) => v.origem === 'ia',
    );
    if (versoesIa.length === 0) {
      return null;
    }
    return versoesIa.reduce((maior, atual) =>
      atual.numero > maior.numero ? atual : maior,
    );
  }

  /**
   * Elaboração ativa (Capítulo 5, métrica que "sai de graça" com o
   * versionamento): diff a nível de caractere entre a última versão de
   * origem `ia` e a versão atual. `caracteresIa` é o que sobrou inalterado do
   * rascunho; `caracteresAluno` é o que o estudante escreveu por cima.
   */
  private calcularElaboracao(fichamento: Fichamento): {
    caracteresIa: number;
    caracteresAluno: number;
    proporcaoAluno: number;
  } {
    const versaoIa = this.primeiraVersaoIa(fichamento);
    const atual = this.ultimaVersao(fichamento);

    if (!versaoIa) {
      return { caracteresIa: 0, caracteresAluno: atual.conteudo.length, proporcaoAluno: 1 };
    }

    const partes = diffChars(versaoIa.conteudo, atual.conteudo);
    let caracteresIa = 0;
    let caracteresAluno = 0;
    for (const parte of partes) {
      if (parte.added) {
        caracteresAluno += parte.value.length;
      } else if (!parte.removed) {
        caracteresIa += parte.value.length;
      }
    }

    const total = caracteresIa + caracteresAluno;
    return {
      caracteresIa,
      caracteresAluno,
      proporcaoAluno: total === 0 ? 0 : caracteresAluno / total,
    };
  }

  private paraSaida(fichamento: Fichamento): FichamentoSaidaDto {
    const secao = fichamento.secao!;
    const base = {
      id: fichamento.id,
      sectionId: fichamento.sectionId,
      trechoCfi: fichamento.trechoCfi ?? null,
      trechoTexto: fichamento.trechoTexto ?? null,
      tituloLivro: secao.livro!.titulo,
      livroId: secao.bookId,
      tituloSecao: secao.titulo,
      statusGeracao: fichamento.statusGeracao,
      erroMensagem: fichamento.erroMensagem ?? null,
      criadoEm: fichamento.criadoEm,
      atualizadoEm: fichamento.atualizadoEm,
    };

    // Item 2.5: ainda não há versão enquanto a geração assíncrona não
    // termina — devolve valores de espera em vez de chamar `ultimaVersao`/
    // `calcularElaboracao` como se já houvesse conteúdo.
    if (fichamento.statusGeracao !== 'pronto' || (fichamento.versoes ?? []).length === 0) {
      return {
        ...base,
        numeroVersaoAtual: 0,
        origemVersaoAtual: 'ia',
        conteudo: '',
        caracteresIa: 0,
        caracteresAluno: 0,
        proporcaoAluno: 0,
      };
    }

    const atual = this.ultimaVersao(fichamento);
    const elaboracao = this.calcularElaboracao(fichamento);
    return {
      ...base,
      numeroVersaoAtual: atual.numero,
      origemVersaoAtual: atual.origem,
      conteudo: atual.conteudo,
      ...elaboracao,
    };
  }
}
