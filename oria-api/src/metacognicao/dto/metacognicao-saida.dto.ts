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
  /** Itens 3.1/3.6 (correção de usabilidade): `true` quando o aluno ainda não
   * tem nenhuma tentativa concluída na rodada de questões mais recente da
   * seção — não há dado para confrontar a autoavaliação, e `sinalizouIlusao`
   * é sempre `false` nesse caso (não por ausência de ilusão, por ausência de
   * dado). `questoesFaltando` conta só a rodada mais recente, não a soma de
   * rodadas antigas já superadas. */
  semDadosDeComparacao: boolean;
  questoesFaltando: number;
}
