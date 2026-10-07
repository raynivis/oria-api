export class ConceitoSaidaDto {
  id: string;
  nome: string;
  descricaoCurta: string;
}

export class ConceitoClassificadoDto {
  conceitoId: string;
  nome: string;
  sectionId: string;
  tituloSecao: string;
}

export class ClassificacaoConceitosDto {
  dominados: ConceitoClassificadoDto[];
  aRevisar: ConceitoClassificadoDto[];
}
