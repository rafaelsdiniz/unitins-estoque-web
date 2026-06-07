export interface ResumoEstoque {
  totalProdutosAtivos: number;
  totalCategorias: number;
  totalUnidades: number;
  valorTotalEstoque: number;
  produtosAbaixoMinimo: number;
  produtosComReposicaoSugerida: number;
  categoriaMaisCritica?: string;
}

export interface CurvaAbcItem {
  produtoId: number;
  produtoNome: string;
  valorEstoque: number;
  percentualDoTotal: number;
  percentualAcumulado: number;
  classe: 'A' | 'B' | 'C';
}

export interface Anomalia {
  produtoId: number;
  produtoNome: string;
  tipo: 'PICO_SAIDA' | 'ESTOQUE_PARADO';
  descricao: string;
  valorReferencia: number;
  valorObservado: number;
}
