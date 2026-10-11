import { IsInt, IsString, Max, MinLength, Min } from 'class-validator';

export class RegistrarMetacognicaoDto {
  @IsString()
  @MinLength(1)
  oQueAprendi: string;

  @IsString()
  @MinLength(1)
  oQueDuvido: string;

  @IsInt()
  @Min(0)
  @Max(100)
  confianca: number;
}
