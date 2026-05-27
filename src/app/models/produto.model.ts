export interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  precoUnitario: number;
  quantidade: number;
  estoqueMinimo: number;
  tempoReposicaoDias?: number;
  categoriaId?: number;
  categoriaNome?: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface ProdutoRequest {
  nome: string;
  descricao?: string;
  precoUnitario: number;
  estoqueMinimo?: number;
  tempoReposicaoDias?: number;
  categoriaId?: number;
}
