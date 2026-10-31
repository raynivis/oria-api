export class MetacognicaoSaidaDto {
  id: string;
  sectionId: string;
  tituloSecao: string;
  oQueAprendi: string;
  oQueDuvido: string;
  confianca: number;
  observacaoIa: string | null;
  sinalizouIlusao: boolean;
  criadoEm: Date;
}
