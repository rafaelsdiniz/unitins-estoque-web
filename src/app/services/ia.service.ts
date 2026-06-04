import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage, ChatResponse } from '../models/ia.model';

@Injectable({ providedIn: 'root' })
export class IaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ia`;

  /** Envia o histórico completo da conversa; o backend é stateless. */
  chat(mensagens: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/chat`, { mensagens });
  }
}
