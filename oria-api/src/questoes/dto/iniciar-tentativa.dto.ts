import { IsString, MinLength } from 'class-validator';

export class IniciarTentativaDto {
  @IsString()
  @MinLength(1)
  resposta: string;
}
