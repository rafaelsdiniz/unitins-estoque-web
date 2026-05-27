export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
}

export interface CategoriaRequest {
  nome: string;
  descricao?: string;
}
