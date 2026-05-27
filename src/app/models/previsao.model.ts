export interface Previsao {
  produtoId: number;
  produtoNome: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  tempoReposicaoDias?: number;
  janelaDias: number;
  saidasNaJanela: number;
  consumoMedioDiario: number;
  diasAteRuptura?: number;
  diasAteEstoqueMinimo?: number;
  reposicaoSugerida: boolean;
  motivo: string;
}
