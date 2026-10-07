import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class GerarQuestoesDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  conceitoIds?: string[];
}
