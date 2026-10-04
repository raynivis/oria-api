export class SecaoReferenciaDto {
  id: string;
  titulo: string;
}

export class SecaoSaidaDto {
  id: string;
  titulo: string;
  textoCompleto: string;
  livro: { id: string; titulo: string };
  anterior: SecaoReferenciaDto | null;
  proxima: SecaoReferenciaDto | null;
}
