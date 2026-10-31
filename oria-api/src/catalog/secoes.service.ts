import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { SecaoSaidaDto } from './dto/secao-saida.dto';
import { Section } from './entities/section.entity';

@Injectable()
export class SecoesService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
  ) {}

  async buscarComNavegacao(id: string): Promise<SecaoSaidaDto> {
    const secao = await this.sectionsRepository.findOne({
      where: { id },
      relations: ['livro'],
    });

    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const [anterior, proxima] = await Promise.all([
      this.sectionsRepository.findOne({
        where: { bookId: secao.bookId, ordem: LessThan(secao.ordem) },
        order: { ordem: 'DESC' },
      }),
      this.sectionsRepository.findOne({
        where: { bookId: secao.bookId, ordem: MoreThan(secao.ordem) },
        order: { ordem: 'ASC' },
      }),
    ]);

    return {
      id: secao.id,
      titulo: secao.titulo,
      textoCompleto: secao.textoCompleto,
      livro: { id: secao.livro.id, titulo: secao.livro.titulo },
      anterior: anterior ? { id: anterior.id, titulo: anterior.titulo } : null,
      proxima: proxima ? { id: proxima.id, titulo: proxima.titulo } : null,
    };
  }
}
