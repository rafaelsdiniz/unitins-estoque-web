import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movimentacao, MovimentacaoRequest } from '../models/movimentacao.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class MovimentacaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/movimentacoes`;

  listarPorProduto(produtoId: number, page = 0, size = 20): Observable<Page<Movimentacao>> {
    const params = new HttpParams()
      .set('produtoId', produtoId)
      .set('page', page)
      .set('size', size);
    return this.http.get<Page<Movimentacao>>(this.base, { params });
  }

  registrar(body: MovimentacaoRequest): Observable<Movimentacao> {
    return this.http.post<Movimentacao>(this.base, body);
  }
}
