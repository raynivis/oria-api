import { IsUUID } from 'class-validator';

export class CriarSessaoDto {
  @IsUUID('4')
  secaoId: string;
}
