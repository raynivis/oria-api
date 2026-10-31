import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export class PassoTentativaDto {
  @IsIn(['justificativa_aluno', 'resolucao'])
  tipo: 'justificativa_aluno' | 'resolucao';

  @ValidateIf((dto: PassoTentativaDto) => dto.tipo === 'justificativa_aluno')
  @IsString()
  @MinLength(1)
  conteudo?: string;
}
