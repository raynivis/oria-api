import { IsNotEmpty, IsString } from 'class-validator';

export class IngerirLivroDto {
  @IsString()
  @IsNotEmpty()
  arquivoPath: string;
}
