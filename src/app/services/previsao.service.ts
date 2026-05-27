import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Previsao } from '../models/previsao.model';

@Injectable({ providedIn: 'root' })
export class PrevisaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/previsao`;

  prever(produtoId: number, janelaDias?: number): Observable<Previsao> {
    let params = new HttpParams();
    if (janelaDias != null) params = params.set('janelaDias', janelaDias);
    return this.http.get<Previsao>(`${this.base}/produtos/${produtoId}`, { params });
  }

  reposicaoSugerida(janelaDias?: number): Observable<Previsao[]> {
    let params = new HttpParams();
    if (janelaDias != null) params = params.set('janelaDias', janelaDias);
    return this.http.get<Previsao[]>(`${this.base}/reposicao-sugerida`, { params });
  }
}
