import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Item 1.9 (correção de usabilidade): o aluno seleciona um termo de 1 a 3
 * palavras dentro de um trecho que já está lendo; o backend nunca recebe o
 * texto completo da seção de novo, só o trecho relevante.
 */
export class ExplicarTermoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  termo: string;

  @IsString()
  @MinLength(1)
  trecho: string;
}
