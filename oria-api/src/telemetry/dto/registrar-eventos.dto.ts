import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TIPOS_EVENTO } from '../tipos-evento';
import type { TipoEvento } from '../tipos-evento';

export class EventoDto {
  @IsIn(TIPOS_EVENTO)
  tipo: TipoEvento;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsISO8601()
  criadoEm: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

/** Cliente acumula e envia a cada 30s; 100 cobre folgado o acúmulo de um intervalo. */
export class RegistrarEventosDto {
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EventoDto)
  eventos: EventoDto[];
}
