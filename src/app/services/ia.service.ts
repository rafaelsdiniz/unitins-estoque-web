import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AssistenteResponse, ChatMessage, ChatResponse, MovimentacaoNl } from '../models/ia.model';

@Injectable({ providedIn: 'root' })
export class IaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ia`;

  /** Chat com contexto fixo (rápido). O backend é stateless: envie todo o histórico. */
  chat(mensagens: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/chat`, { mensagens });
  }

  /**
   * Agente com ferramentas: consulta o sistema sob demanda (produtos, previsão,
   * resumo, curva ABC, anomalias, histórico). Mais poderoso para perguntas abertas.
   */
  agente(mensagens: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/agente`, { mensagens });
  }

  /** Resumo executivo do estoque em linguagem natural. */
  resumo(): Observable<AssistenteResponse> {
    return this.http.get<AssistenteResponse>(`${this.base}/resumo`);
  }

  /** Rascunho de pedido de compra a partir das reposições sugeridas. */
  pedidoCompra(): Observable<AssistenteResponse> {
    return this.http.get<AssistenteResponse>(`${this.base}/pedido-compra`);
  }

  /** Interpreta uma frase em movimentação (pré-visualização; não grava). */
  movimentacaoNl(texto: string): Observable<MovimentacaoNl> {
    return this.http.post<MovimentacaoNl>(`${this.base}/movimentacao-nl`, { texto });
  }
}
