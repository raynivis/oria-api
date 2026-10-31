import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LivroSaidaDto } from './dto/livro-saida.dto';
import { SumarioNoDto } from './dto/sumario-no.dto';
import { Book } from './entities/book.entity';
import { Section } from './entities/section.entity';

@Injectable()
export class LivrosService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
  ) {}

  async listarProntos(): Promise<LivroSaidaDto[]> {
    const livros = await this.booksRepository.find({
      where: { status: 'pronto' },
      order: { criadoEm: 'ASC' },
    });

    return livros.map((livro) => this.paraSaida(livro));
  }

  async buscarProntoPorId(id: string): Promise<LivroSaidaDto> {
    const livro = await this.booksRepository.findOne({
      where: { id, status: 'pronto' },
    });

    if (!livro) {
      throw new NotFoundException('Livro não encontrado.');
    }

    return this.paraSaida(livro);
  }

  async montarSumario(id: string): Promise<SumarioNoDto[]> {
    const livro = await this.booksRepository.findOne({
      where: { id, status: 'pronto' },
    });

    if (!livro) {
      throw new NotFoundException('Livro não encontrado.');
    }

    const secoes = await this.sectionsRepository.find({
      where: { bookId: id },
      order: { ordem: 'ASC' },
    });

    return this.montarArvore(secoes);
  }

  private montarArvore(secoes: Section[]): SumarioNoDto[] {
    const porId = new Map<string, SumarioNoDto>();

    for (const secao of secoes) {
      porId.set(secao.id, {
        id: secao.id,
        titulo: secao.titulo,
        nivel: secao.nivel,
        ordem: secao.ordem,
        href: secao.href,
        filhas: [],
      });
    }

    const raizes: SumarioNoDto[] = [];

    for (const secao of secoes) {
      const no = porId.get(secao.id)!;
      const pai = secao.parentId ? porId.get(secao.parentId) : undefined;

      if (pai) {
        pai.filhas.push(no);
      } else {
        raizes.push(no);
      }
    }

    return raizes;
  }

  private paraSaida(livro: Book): LivroSaidaDto {
    return {
      id: livro.id,
      titulo: livro.titulo,
      autor: livro.autor,
      isbn: livro.isbn,
      criadoEm: livro.criadoEm,
    };
  }
}
