import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Produto } from '../../models/produto.model';
import { Previsao } from '../../models/previsao.model';
import { PrevisaoService } from '../../services/previsao.service';
import { ProdutoService } from '../../services/produto.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Dashboard"
        [subtitle]="'Bem-vindo de volta, ' + (auth.me()?.nome ?? '') + ' 👋'"
        icon="space_dashboard"
      ></app-page-header>

      @if (loading()) {
        <div class="loading"><mat-spinner /></div>
      } @else {
        <!-- KPIs -->
        <div class="kpis">
          <div class="kpi">
            <div class="kpi-icon kpi-icon--primary"><mat-icon>inventory_2</mat-icon></div>
            <div class="kpi-value tnum">{{ totalAtivos() }}</div>
            <div class="kpi-label">Produtos ativos</div>
            <div class="kpi-sub">no catálogo</div>
          </div>

          <div class="kpi">
            <div class="kpi-icon kpi-icon--success"><mat-icon>payments</mat-icon></div>
            <div class="kpi-value tnum">{{ stockValue() | currency: 'BRL' : 'symbol' : '1.0-0' }}</div>
            <div class="kpi-label">Valor em estoque</div>
            <div class="kpi-sub">preço × quantidade</div>
          </div>

          <div class="kpi">
            <div class="kpi-icon kpi-icon--warning"><mat-icon>warning</mat-icon></div>
            <div class="kpi-value tnum">{{ baixoCount() }}</div>
            <div class="kpi-label">Baixo estoque</div>
            <div class="kpi-sub">abaixo do mínimo</div>
          </div>

          <div class="kpi">
            <div class="kpi-icon kpi-icon--info"><mat-icon>auto_awesome</mat-icon></div>
            <div class="kpi-value tnum">{{ sugestoes().length }}</div>
            <div class="kpi-label">Reposição sugerida</div>
            <div class="kpi-sub">recomendados pela IA</div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="charts">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title><mat-icon class="bloco-icon">monitoring</mat-icon> Saúde do estoque</mat-card-title>
              <mat-card-subtitle>Distribuição dos produtos ativos</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="donut-wrap">
                <div class="donut">
                  <svg viewBox="0 0 120 120">
                    <circle class="donut-track" cx="60" cy="60" r="48" pathLength="100" />
                    <circle
                      class="donut-seg s-green"
                      cx="60" cy="60" r="48" pathLength="100"
                      [attr.stroke-dasharray]="pctSaud() + ' 100'"
                    />
                    <circle
                      class="donut-seg s-amber"
                      cx="60" cy="60" r="48" pathLength="100"
                      [attr.stroke-dasharray]="pctBaixo() + ' 100'"
                      [attr.stroke-dashoffset]="-pctSaud()"
                    />
                  </svg>
                  <div class="donut-center">
                    <div class="donut-pct tnum">{{ pctSaud() }}%</div>
                    <div class="donut-lbl">saudável</div>
                  </div>
                </div>
                <div class="legend">
                  <div class="legend-item">
                    <span class="dot d-green"></span> Saudável
                    <strong class="tnum">{{ saudaveis() }}</strong>
                  </div>
                  <div class="legend-item">
                    <span class="dot d-amber"></span> Baixo estoque
                    <strong class="tnum">{{ baixoCount() }}</strong>
                  </div>
                  <div class="legend-item legend-total">
                    <span class="dot d-soft"></span> Total ativos
                    <strong class="tnum">{{ totalAtivos() }}</strong>
                  </div>
                  <div class="legend-foot">
                    <mat-icon>trending_down</mat-icon>
                    {{ totalSaidas() | number: '1.0-0' }} saídas nos últimos 30 dias
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title><mat-icon class="bloco-icon">bar_chart</mat-icon> Produtos por categoria</mat-card-title>
              <mat-card-subtitle>Top categorias por quantidade de itens</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (categorias().length === 0) {
                <app-empty-state
                  icon="category"
                  title="Sem dados"
                  description="Cadastre produtos com categorias para ver a distribuição."
                ></app-empty-state>
              } @else {
                <div class="bars">
                  @for (c of categorias(); track c.nome) {
                    <div class="bar-row">
                      <div class="bar-head">
                        <span class="bar-name">{{ c.nome }}</span>
                        <span class="bar-val tnum">{{ c.count }}</span>
                      </div>
                      <div class="bar-track">
                        <div class="bar-fill" [style.width.%]="c.pct"></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Sugestões IA -->
        <mat-card class="bloco">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="bloco-icon">psychology</mat-icon>
              Sugestões de reposição
            </mat-card-title>
            <mat-card-subtitle>
              Baseado em consumo médio dos últimos 30 dias
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (sugestoes().length === 0) {
              <app-empty-state
                icon="check_circle"
                title="Tudo certo por aqui"
                description="Nenhum produto precisa de reposição no momento."
              ></app-empty-state>
            } @else {
              <table mat-table [dataSource]="sugestoes()" class="tabela">
                <ng-container matColumnDef="produto">
                  <th mat-header-cell *matHeaderCellDef>Produto</th>
                  <td mat-cell *matCellDef="let p"><strong>{{ p.produtoNome }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="atual">
                  <th mat-header-cell *matHeaderCellDef>Estoque</th>
                  <td mat-cell *matCellDef="let p">
                    <span class="pill">{{ p.quantidadeAtual }} / {{ p.estoqueMinimo }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="consumo">
                  <th mat-header-cell *matHeaderCellDef>Consumo/dia</th>
                  <td mat-cell *matCellDef="let p">{{ p.consumoMedioDiario | number: '1.0-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="ruptura">
                  <th mat-header-cell *matHeaderCellDef>Ruptura em</th>
                  <td mat-cell *matCellDef="let p">
                    @if (p.diasAteRuptura != null) {
                      <span class="pill" [class.urgente]="p.diasAteRuptura <= 3">
                        <mat-icon class="pill-icon">schedule</mat-icon>
                        {{ p.diasAteRuptura }} d
                      </span>
                    } @else {
                      —
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="motivo">
                  <th mat-header-cell *matHeaderCellDef>Motivo</th>
                  <td mat-cell *matCellDef="let p" class="motivo">{{ p.motivo }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="colunas"></tr>
                <tr mat-row *matRowDef="let row; columns: colunas"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>

        <!-- Baixo estoque -->
        <mat-card class="bloco">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="bloco-icon">warning</mat-icon>
              Abaixo do estoque mínimo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (baixoEstoque().length === 0) {
              <app-empty-state
                icon="inventory_2"
                title="Estoques saudáveis"
                description="Todos os produtos estão acima do mínimo configurado."
              ></app-empty-state>
            } @else {
              <table mat-table [dataSource]="baixoEstoque()" class="tabela">
                <ng-container matColumnDef="codigo">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let p"><code class="code">{{ p.codigo }}</code></td>
                </ng-container>
                <ng-container matColumnDef="nome">
                  <th mat-header-cell *matHeaderCellDef>Produto</th>
                  <td mat-cell *matCellDef="let p"><strong>{{ p.nome }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="qtd">
                  <th mat-header-cell *matHeaderCellDef>Qtd atual</th>
                  <td mat-cell *matCellDef="let p"><span class="pill urgente">{{ p.quantidade }}</span></td>
                </ng-container>
                <ng-container matColumnDef="min">
                  <th mat-header-cell *matHeaderCellDef>Mínimo</th>
                  <td mat-cell *matCellDef="let p">{{ p.estoqueMinimo }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="colunasBaixo"></tr>
                <tr mat-row *matRowDef="let row; columns: colunasBaixo"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .loading { display: grid; place-items: center; padding: 4rem; }

    /* ── KPIs ────────────────────────────────── */
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .kpi {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      border-radius: var(--r-lg);
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    }

    .kpi:hover { box-shadow: var(--shadow-md); border-color: var(--c-border-strong); }

    .kpi-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--r-md);
      display: grid;
      place-items: center;
      margin-bottom: 0.875rem;
    }

    .kpi-icon mat-icon { font-size: 21px; width: 21px; height: 21px; }
    .kpi-icon--primary { background: var(--c-primary-soft); color: var(--c-primary); }
    .kpi-icon--success { background: var(--c-success-soft); color: var(--c-success); }
    .kpi-icon--warning { background: var(--c-warning-soft); color: var(--c-warning); }
    .kpi-icon--info    { background: var(--c-info-soft);    color: var(--c-info); }

    .kpi-value {
      font-size: 1.875rem;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: var(--c-text);
    }

    .kpi-label { font-size: 0.875rem; font-weight: 600; color: var(--c-text); margin-top: 0.5rem; }
    .kpi-sub { font-size: 0.78rem; color: var(--c-text-muted); margin-top: 2px; }

    /* ── Charts row ──────────────────────────── */
    .charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 900px) { .charts { grid-template-columns: 1fr; } }

    .bloco-icon { vertical-align: middle; margin-right: 0.4rem; color: var(--c-primary); }
    .mat-mdc-card-title { display: flex; align-items: center; }

    /* Donut */
    .donut-wrap {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
      padding: 0.5rem 0;
    }

    .donut { position: relative; width: 168px; height: 168px; flex-shrink: 0; }
    .donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .donut-track { fill: none; stroke: var(--c-surface-2); stroke-width: 13; }
    .donut-seg { fill: none; stroke-width: 13; stroke-linecap: butt; transition: stroke-dasharray 0.7s ease; }
    .s-green { stroke: var(--c-success); }
    .s-amber { stroke: var(--c-warning); }

    .donut-center {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      text-align: center;
      line-height: 1;
    }
    .donut-pct { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.03em; color: var(--c-text); }
    .donut-lbl { font-size: 0.78rem; color: var(--c-text-muted); margin-top: 4px; }

    .legend { display: flex; flex-direction: column; gap: 0.875rem; flex: 1; min-width: 180px; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--c-text-muted); }
    .legend-item strong { margin-left: auto; color: var(--c-text); font-weight: 700; }
    .dot { width: 11px; height: 11px; border-radius: 4px; flex-shrink: 0; }
    .d-green { background: var(--c-success); }
    .d-amber { background: var(--c-warning); }
    .d-soft  { background: var(--c-border-strong); }

    .legend-foot {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.25rem;
      padding-top: 0.875rem;
      border-top: 1px solid var(--c-border);
      font-size: 0.8rem;
      color: var(--c-text-muted);
    }
    .legend-foot mat-icon { font-size: 17px; width: 17px; height: 17px; color: var(--c-text-soft); }

    /* Barras */
    .bars { display: flex; flex-direction: column; gap: 1rem; padding: 0.25rem 0; }
    .bar-head { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
    .bar-name { font-size: 0.875rem; font-weight: 550; color: var(--c-text); }
    .bar-val { font-size: 0.85rem; color: var(--c-text-muted); font-weight: 600; }
    .bar-track { height: 9px; background: var(--c-surface-2); border-radius: 999px; overflow: hidden; }
    .bar-fill {
      height: 100%;
      background: var(--grad-primary);
      border-radius: 999px;
      transition: width 0.7s ease;
      min-width: 6px;
    }

    /* ── Tabelas ─────────────────────────────── */
    .tabela { width: 100%; }
    .motivo { color: var(--c-text-muted); font-size: 0.85rem; }
    .code {
      background: var(--c-primary-soft);
      color: var(--c-primary);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--c-primary-soft);
      color: var(--c-primary);
      padding: 3px 10px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.78rem;
    }
    .pill.urgente { background: var(--c-danger-soft); color: var(--c-danger); }
    .pill-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; }
  `,
})
export class DashboardPage {
  protected auth = inject(AuthService);
  private previsaoService = inject(PrevisaoService);
  private produtoService = inject(ProdutoService);

  readonly loading = signal(true);
  readonly sugestoes = signal<Previsao[]>([]);
  readonly baixoEstoque = signal<Produto[]>([]);
  readonly produtos = signal<Produto[]>([]);

  readonly colunas = ['produto', 'atual', 'consumo', 'ruptura', 'motivo'];
  readonly colunasBaixo = ['codigo', 'nome', 'qtd', 'min'];

  readonly totalAtivos = computed(() => this.produtos().filter((p) => p.ativo).length);
  readonly stockValue = computed(() =>
    this.produtos().reduce((acc, p) => acc + (p.precoUnitario ?? 0) * (p.quantidade ?? 0), 0),
  );
  readonly baixoCount = computed(() => this.baixoEstoque().length);
  readonly saudaveis = computed(() => Math.max(0, this.totalAtivos() - this.baixoCount()));
  readonly pctSaud = computed(() => {
    const t = this.totalAtivos();
    return t ? Math.round((this.saudaveis() / t) * 100) : 100;
  });
  readonly pctBaixo = computed(() => 100 - this.pctSaud());
  readonly totalSaidas = computed(() =>
    this.sugestoes().reduce((acc, s) => acc + (s.saidasNaJanela ?? 0), 0),
  );

  readonly categorias = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.produtos()) {
      if (!p.ativo) continue;
      const k = p.categoriaNome || 'Sem categoria';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const arr = [...map.entries()].map(([nome, count]) => ({ nome, count }));
    arr.sort((a, b) => b.count - a.count);
    const top = arr.slice(0, 6);
    const max = Math.max(1, ...top.map((c) => c.count));
    return top.map((c) => ({ ...c, pct: Math.round((c.count / max) * 100) }));
  });

  constructor() {
    forkJoin({
      sugestoes: this.previsaoService.reposicaoSugerida(),
      baixoEstoque: this.produtoService.baixoEstoque(),
      produtos: this.produtoService.listar({ size: 500 }),
    }).subscribe({
      next: ({ sugestoes, baixoEstoque, produtos }) => {
        this.sugestoes.set(sugestoes);
        this.baixoEstoque.set(baixoEstoque);
        this.produtos.set(produtos.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
