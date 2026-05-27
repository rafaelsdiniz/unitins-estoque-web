import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria, CategoriaRequest } from '../models/categoria.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/categorias`;

  listar(page = 0, size = 20): Observable<Page<Categoria>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Categoria>>(this.base, { params });
  }

  buscar(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.base}/${id}`);
  }

  criar(body: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.base, body);
  }

  atualizar(id: number, body: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.base}/${id}`, body);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
