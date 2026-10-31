import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
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

const CODIGO_VIOLACAO_UNICIDADE_POSTGRES = '23505';

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
      relations: ['versoes'],
    });
    if (existente) {
      return this.paraSaida(existente);
    }

    const secao = await this.sectionsRepository.findOneBy({ id: sectionId });
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
        this.fichamentosRepository.create({ userId, sectionId, trechoCfi }),
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
      return this.paraSaida(fichamento);
    } catch (erro) {
      // Duas requisições concorrentes pedindo o mesmo (seção, trecho) na
      // primeira chamada: a segunda esbarra no unique e só precisa devolver
      // o que a primeira já gravou, não falhar.
      if (this.ehViolacaoDeUnicidade(erro)) {
        const jaGravado = await this.fichamentosRepository.findOne({
          where: { userId, sectionId, trechoCfi: trechoCfi ?? IsNull() },
          relations: ['versoes'],
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

  async listarMeus(
    userId: string,
    livroId?: string,
  ): Promise<FichamentoResumoDto[]> {
    const fichamentos = await this.carregarComSecaoELivro(userId, livroId);
    return fichamentos.map((fichamento) => this.paraResumo(fichamento));
  }

  async exportarMarkdown(userId: string): Promise<string> {
    const fichamentos = await this.carregarComSecaoELivro(userId);

    const blocos = fichamentos.map((fichamento) => {
      const secao = fichamento.secao!;
      const ultimaVersao = this.ultimaVersao(fichamento);
      const titulo = fichamento.trechoCfi
        ? `${secao.titulo} — trecho ${fichamento.trechoCfi}`
        : secao.titulo;
      return `# ${secao.livro.titulo}\n\n## ${titulo}\n\n${ultimaVersao.conteudo}`;
    });

    return blocos.join('\n\n---\n\n');
  }

  private async carregarComSecaoELivro(
    userId: string,
    livroId?: string,
  ): Promise<Array<Fichamento & { secao: Section & { livro: Book } }>> {
    const fichamentos = await this.fichamentosRepository.find({
      where: { userId },
      relations: ['versoes'],
      order: { atualizadoEm: 'DESC' },
    });

    const comSecao = await Promise.all(
      fichamentos.map(async (fichamento) => {
        const secao = await this.sectionsRepository.findOne({
          where: { id: fichamento.sectionId },
          relations: ['livro'],
        });
        return Object.assign(fichamento, { secao: secao ?? undefined });
      }),
    );

    const filtrados = livroId
      ? comSecao.filter((f) => f.secao?.bookId === livroId)
      : comSecao;

    return filtrados.filter(
      (f): f is Fichamento & { secao: Section & { livro: Book } } =>
        f.secao !== undefined,
    );
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
    };
  }

  private async buscarDoAluno(
    userId: string,
    id: string,
  ): Promise<Fichamento> {
    const fichamento = await this.fichamentosRepository.findOne({
      where: { id, userId },
      relations: ['versoes'],
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
    const atual = this.ultimaVersao(fichamento);
    const elaboracao = this.calcularElaboracao(fichamento);
    return {
      id: fichamento.id,
      sectionId: fichamento.sectionId,
      trechoCfi: fichamento.trechoCfi ?? null,
      numeroVersaoAtual: atual.numero,
      origemVersaoAtual: atual.origem,
      conteudo: atual.conteudo,
      ...elaboracao,
      criadoEm: fichamento.criadoEm,
      atualizadoEm: fichamento.atualizadoEm,
    };
  }
}
