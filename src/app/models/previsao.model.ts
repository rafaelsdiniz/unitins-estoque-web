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
  // v2 — inteligência adicional
  consumoMedioPonderado: number;
  tendencia: 'ALTA' | 'BAIXA' | 'ESTAVEL' | 'SEM_DADOS';
  quantidadeSugerida?: number;
  nivelConfianca: 'ALTA' | 'MEDIA' | 'BAIXA';
  movimentacoesSaidaNaJanela: number;
}
