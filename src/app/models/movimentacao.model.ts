export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

export interface Movimentacao {
  id: number;
  produtoId: number;
  produtoNome: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  precoUnitarioNaEpoca?: number;
  dataHora: string;
  usuarioId?: number;
  usuarioNome?: string;
  observacao?: string;
}

export interface MovimentacaoRequest {
  produtoId: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  observacao?: string;
}
