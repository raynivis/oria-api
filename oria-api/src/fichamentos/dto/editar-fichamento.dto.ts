import { IsString, MinLength } from 'class-validator';

export class EditarFichamentoDto {
  @IsString()
  @MinLength(1)
  conteudo: string;
}
