import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from '../models/page.model';
import { Produto, ProdutoRequest } from '../models/produto.model';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/produtos`;

  listar(opts: { nome?: string; page?: number; size?: number } = {}): Observable<Page<Produto>> {
    let params = new HttpParams()
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 10);
    if (opts.nome) params = params.set('nome', opts.nome);
    return this.http.get<Page<Produto>>(this.base, { params });
  }

  buscar(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.base}/${id}`);
  }

  baixoEstoque(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.base}/baixo-estoque`);
  }

  criar(body: ProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(this.base, body);
  }

  atualizar(id: number, body: ProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${this.base}/${id}`, body);
  }

  desativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
