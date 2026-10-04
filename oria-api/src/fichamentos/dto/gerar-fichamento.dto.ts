import { IsString, MinLength, ValidateIf } from 'class-validator';

/**
 * Os dois campos são opcionais juntos, nunca sozinhos: `trechoCfi` é só a
 * âncora de citação, quem alimenta o prompt é `trechoTexto`. Sem corpo, gera
 * o fichamento da seção inteira (IMPLEMENTATION.md, Fase 5).
 */
export class GerarFichamentoDto {
  @ValidateIf((dto: GerarFichamentoDto) => dto.trechoTexto !== undefined)
  @IsString()
  trechoCfi?: string;

  @ValidateIf((dto: GerarFichamentoDto) => dto.trechoCfi !== undefined)
  @IsString()
  @MinLength(1)
  trechoTexto?: string;
}
