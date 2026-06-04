export type Papel = 'user' | 'assistant';

export interface ChatMessage {
  papel: Papel;
  conteudo: string;
}

export interface ChatResponse {
  resposta: string;
}
