import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString()
  @MinLength(1)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;
}
