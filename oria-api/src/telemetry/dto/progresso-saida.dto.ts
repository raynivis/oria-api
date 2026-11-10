export class ProgressoSaidaDto {
  secoesAbertas: number;
  fichamentos: {
    total: number;
    comEdicaoDoAluno: number;
  };
  /** Item 1.4 (correção de usabilidade): última seção com evento "abriu" do
   * aluno, para "continuar leitura" sem depender de armazenamento local no
   * navegador. `null` quando o aluno nunca abriu nenhuma seção. */
  ultimaSecaoLida: { sectionId: string; tituloSecao: string; livroId: string } | null;
}
