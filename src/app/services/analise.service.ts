import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Anomalia, CurvaAbcItem, ResumoEstoque } from '../models/analise.model';

@Injectable({ providedIn: 'root' })
export class AnaliseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/analise`;

  resumo(): Observable<ResumoEstoque> {
    return this.http.get<ResumoEstoque>(`${this.base}/resumo`);
  }

  curvaAbc(): Observable<CurvaAbcItem[]> {
    return this.http.get<CurvaAbcItem[]>(`${this.base}/curva-abc`);
  }

  anomalias(janelaDias?: number): Observable<Anomalia[]> {
    let params = new HttpParams();
    if (janelaDias != null) params = params.set('janelaDias', janelaDias);
    return this.http.get<Anomalia[]>(`${this.base}/anomalias`, { params });
  }
}
