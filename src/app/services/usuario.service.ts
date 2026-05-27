import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from '../models/page.model';
import { Usuario, UsuarioUpdateRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar(page = 0, size = 10): Observable<Page<Usuario>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Usuario>>(this.base, { params });
  }

  buscar(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  atualizar(id: number, body: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, body);
  }

  desativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
