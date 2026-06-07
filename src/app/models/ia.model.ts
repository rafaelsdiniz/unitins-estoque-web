export type Papel = 'user' | 'assistant';

export interface ChatMessage {
  papel: Papel;
  conteudo: string;
}

export interface ChatResponse {
  resposta: string;
}

/** Resposta dos endpoints de geração em texto (resumo, pedido de compra). */
export interface AssistenteResponse {
  resposta: string;
}

/** Pré-visualização de uma movimentação interpretada de linguagem natural. */
export interface MovimentacaoNl {
  interpretado: boolean;
  produtoId?: number;
  produtoNome?: string;
  tipo?: 'ENTRADA' | 'SAIDA';
  quantidade?: number;
  mensagem: string;
}
