/** Item 1.11 (correção de usabilidade): forma persistida de uma citação do
 * diálogo — carrega a seção de origem e a posição do trecho (`ancoraCfi`),
 * não só o id do chunk, para o frontend conseguir navegar até lá. É o mesmo
 * formato que já era montado só para o evento SSE `citacao` e descartado
 * depois de emitido. */
export interface CitacaoPersistida {
  chunkId: string;
  sectionId: string;
  trecho: string;
  ancoraCfi: string;
  secaoTitulo: string;
}

/** Item 1.1 (correção de usabilidade): sugestões acionáveis devolvidas junto
 * com a recusa, quando nenhum trecho acima do limiar é encontrado nem na
 * seção aberta nem no livro inteiro. O backend só devolve as opções; quem as
 * desenha é o frontend. */
export type TipoSugestaoRecusa = 'buscar_outras_secoes' | 'abrir_glossario' | 'inferir_pelo_contexto';

export interface SugestaoRecusa {
  tipo: TipoSugestaoRecusa;
  descricao: string;
  sectionId?: string;
}
