import { IsString, IsUUID, MinLength } from 'class-validator';

export class CriarReporteDto {
  @IsString()
  @MinLength(1)
  alvoTipo: string;

  @IsUUID('4')
  alvoId: string;

  @IsString()
  @MinLength(1)
  descricao: string;
}
