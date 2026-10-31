export class ConjuntoSaidaDto {
  id: string;
  sectionId: string;
  criadoEm: Date;
  questoes: Array<{
    id: string;
    ordem: number;
    enunciado: string;
    conceitos: Array<{ id: string; nome: string }>;
  }>;
}
