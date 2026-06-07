import { CurrencyPipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { forkJoin, Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Anomalia } from '../../models/analise.model';
import { Produto } from '../../models/produto.model';
import { Previsao } from '../../models/previsao.model';
import { AnaliseService } from '../../services/analise.service';
import { IaService } from '../../services/ia.service';
import { PrevisaoService } from '../../services/previsao.service';
import { ProdutoService } from '../../services/produto.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

const FONT = 'Plus Jakarta Sans, system-ui, sans-serif';
const PALETTE = ['#1d3f8f', '#2a52b0', '#3f6fd1', '#f5a623', '#0e9f6e', '#0ea5e9', '#7c5cf0'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    CurrencyPipe,
    LowerCasePipe,
    MarkdownPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    NgApexchartsModule,
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
          <div class="kpi kpi--primary">
            <div class="kpi-top">
              <div class="kpi-icon"><mat-icon>inventory_2</mat-icon></div>
              <div class="kpi-value tnum">{{ totalAtivos() }}</div>
            </div>
            <div class="kpi-label">Produtos ativos</div>
            <div class="kpi-sub">no catálogo</div>
          </div>

          <div class="kpi kpi--success">
            <div class="kpi-top">
              <div class="kpi-icon"><mat-icon>payments</mat-icon></div>
              <div class="kpi-value tnum">{{ stockValue() | currency: 'BRL' : 'symbol' : '1.0-0' }}</div>
            </div>
            <div class="kpi-label">Valor em estoque</div>
            <div class="kpi-sub">preço × quantidade</div>
          </div>

          <div class="kpi kpi--warning">
            <div class="kpi-top">
              <div class="kpi-icon"><mat-icon>warning</mat-icon></div>
              <div class="kpi-value tnum">{{ baixoCount() }}</div>
            </div>
            <div class="kpi-label">Baixo estoque</div>
            <div class="kpi-sub">abaixo do mínimo</div>
          </div>

          <div class="kpi kpi--info">
            <div class="kpi-top">
              <div class="kpi-icon"><mat-icon>auto_awesome</mat-icon></div>
              <div class="kpi-value tnum">{{ sugestoes().length }}</div>
            </div>
            <div class="kpi-label">Reposição sugerida</div>
            <div class="kpi-sub">recomendados pela IA</div>
          </div>
        </div>

        <!-- Inteligência (IA) sob demanda -->
        <mat-card class="bloco bloco-ia">
          <mat-card-header>
            <mat-card-title><mat-icon class="bloco-icon">auto_awesome</mat-icon> Inteligência (IA)</mat-card-title>
            <mat-card-subtitle>Resumo executivo e pedido de compra gerados pela DeepSeek</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="ia-acoes">
              <button mat-flat-button color="primary" (click)="gerarResumo()" [disabled]="iaCarregando()">
                <mat-icon>summarize</mat-icon> Resumo executivo
              </button>
              <button mat-stroked-button (click)="gerarPedido()" [disabled]="iaCarregando()">
                <mat-icon>shopping_cart_checkout</mat-icon> Pedido de compra
              </button>
            </div>

            @if (iaCarregando()) {
              <div class="ia-loading"><mat-spinner diameter="22" /> <span>Gerando {{ iaTitulo() | lowercase }}…</span></div>
            } @else if (iaErro()) {
              <div class="ia-erro"><mat-icon>error_outline</mat-icon> {{ iaErro() }}</div>
            } @else if (iaTexto()) {
              <div class="ia-saida">
                <div class="ia-saida-titulo">{{ iaTitulo() }}</div>
                <p class="ia-saida-texto" [innerHTML]="iaTexto() | markdown"></p>
              </div>
            } @else {
              <p class="ia-dica">Clique em uma ação acima para a IA analisar o estoque atual.</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Gráficos -->
        <div class="charts">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title><mat-icon class="bloco-icon">monitoring</mat-icon> Saúde do estoque</mat-card-title>
              <mat-card-subtitle>Distribuição dos produtos ativos</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (totalAtivos() === 0) {
                <app-empty-state
                  icon="monitoring"
                  title="Sem dados"
                  description="Cadastre produtos ativos para ver a saúde do estoque."
                ></app-empty-state>
              } @else {
                <apx-chart
                  [series]="healthChart().series"
                  [chart]="healthChart().chart"
                  [labels]="healthChart().labels"
                  [colors]="healthChart().colors"
                  [plotOptions]="healthChart().plotOptions"
                  [dataLabels]="healthChart().dataLabels"
                  [legend]="healthChart().legend"
                  [stroke]="healthChart().stroke"
                  [tooltip]="healthChart().tooltip"
                ></apx-chart>
                <div class="chart-foot">
                  <mat-icon>trending_down</mat-icon>
                  {{ totalSaidas() | number: '1.0-0' }} saídas nos últimos 30 dias
                </div>
              }
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
                <apx-chart
                  [series]="catChart().series"
                  [chart]="catChart().chart"
                  [colors]="catChart().colors"
                  [plotOptions]="catChart().plotOptions"
                  [dataLabels]="catChart().dataLabels"
                  [xaxis]="catChart().xaxis"
                  [yaxis]="catChart().yaxis"
                  [grid]="catChart().grid"
                  [legend]="catChart().legend"
                  [tooltip]="catChart().tooltip"
                ></apx-chart>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Top produtos por valor -->
        <mat-card class="bloco">
          <mat-card-header>
            <mat-card-title><mat-icon class="bloco-icon">paid</mat-icon> Top produtos por valor em estoque</mat-card-title>
            <mat-card-subtitle>Maior capital imobilizado (preço × quantidade)</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (topValor().length === 0) {
              <app-empty-state
                icon="paid"
                title="Sem dados"
                description="Cadastre produtos com preço e quantidade para ver o ranking."
              ></app-empty-state>
            } @else {
              <apx-chart
                [series]="valorChart().series"
                [chart]="valorChart().chart"
                [colors]="valorChart().colors"
                [fill]="valorChart().fill"
                [plotOptions]="valorChart().plotOptions"
                [dataLabels]="valorChart().dataLabels"
                [xaxis]="valorChart().xaxis"
                [yaxis]="valorChart().yaxis"
                [grid]="valorChart().grid"
                [tooltip]="valorChart().tooltip"
              ></apx-chart>
            }
          </mat-card-content>
        </mat-card>

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
                  <td mat-cell *matCellDef="let p">
                    <strong>{{ p.produtoNome }}</strong>
                    @if (p.tendencia === 'ALTA') {
                      <span class="tend tend-up" title="Consumo em alta"><mat-icon class="pill-icon">trending_up</mat-icon></span>
                    } @else if (p.tendencia === 'BAIXA') {
                      <span class="tend tend-down" title="Consumo em queda"><mat-icon class="pill-icon">trending_down</mat-icon></span>
                    }
                  </td>
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
                <ng-container matColumnDef="sugerido">
                  <th mat-header-cell *matHeaderCellDef>Comprar</th>
                  <td mat-cell *matCellDef="let p">
                    @if (p.quantidadeSugerida) {
                      <span class="pill pill-buy">
                        <mat-icon class="pill-icon">shopping_cart</mat-icon>
                        {{ p.quantidadeSugerida }}
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

        <!-- Anomalias detectadas -->
        <mat-card class="bloco">
          <mat-card-header>
            <mat-card-title><mat-icon class="bloco-icon">notifications_active</mat-icon> Anomalias de consumo</mat-card-title>
            <mat-card-subtitle>Picos de saída e estoque parado nos últimos 30 dias</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (anomalias().length === 0) {
              <app-empty-state
                icon="task_alt"
                title="Nada fora do normal"
                description="Nenhuma anomalia de consumo foi detectada na janela."
              ></app-empty-state>
            } @else {
              <div class="anomalias">
                @for (a of anomalias(); track a.produtoId + a.tipo) {
                  <div class="anomalia" [class.anomalia-pico]="a.tipo === 'PICO_SAIDA'">
                    <div class="anomalia-icon">
                      <mat-icon>{{ a.tipo === 'PICO_SAIDA' ? 'bolt' : 'pause_circle' }}</mat-icon>
                    </div>
                    <div class="anomalia-corpo">
                      <div class="anomalia-topo">
                        <strong>{{ a.produtoNome }}</strong>
                        <span class="tag">{{ a.tipo === 'PICO_SAIDA' ? 'Pico de saída' : 'Estoque parado' }}</span>
                      </div>
                      <div class="anomalia-desc">{{ a.descricao }}</div>
                    </div>
                  </div>
                }
              </div>
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
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      border-radius: var(--r-lg);
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }
    /* faixa de acento no topo (cara de cartão BI) */
    .kpi::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 3px;
      background: var(--accent, var(--c-primary));
    }
    .kpi:hover { box-shadow: var(--shadow-md); border-color: var(--c-border-strong); transform: translateY(-2px); }

    .kpi--primary { --accent: var(--c-primary); --accent-soft: var(--c-primary-soft); }
    .kpi--success { --accent: var(--c-success); --accent-soft: var(--c-success-soft); }
    .kpi--warning { --accent: var(--c-warning); --accent-soft: var(--c-warning-soft); }
    .kpi--info    { --accent: var(--c-info);    --accent-soft: var(--c-info-soft); }

    .kpi-top { display: flex; align-items: center; gap: 0.875rem; }

    .kpi-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--r-md);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      background: var(--accent-soft);
      color: var(--accent);
    }
    .kpi-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .kpi-value {
      font-family: var(--font-brand);
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: var(--c-text);
    }

    .kpi-label { font-size: 0.875rem; font-weight: 600; color: var(--c-text); margin-top: 0.875rem; }
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

    .chart-foot {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.5rem;
      padding-top: 0.875rem;
      border-top: 1px solid var(--c-border);
      font-size: 0.8rem;
      color: var(--c-text-muted);
    }
    .chart-foot mat-icon { font-size: 17px; width: 17px; height: 17px; color: var(--c-text-soft); }

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
    .pill.pill-buy { background: var(--c-success-soft); color: var(--c-success); }
    .pill-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; }

    /* Tendência (chip ao lado do nome) */
    .tend { display: inline-flex; vertical-align: middle; margin-left: 5px; }
    .tend mat-icon { font-size: 15px !important; width: 15px !important; height: 15px !important; }
    .tend-up { color: var(--c-danger); }
    .tend-down { color: var(--c-success); }

    /* Card de IA */
    .bloco-ia .ia-acoes { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 0.5rem; }
    .ia-acoes button mat-icon { margin-right: 0.35rem; }
    .ia-loading { display: flex; align-items: center; gap: 0.6rem; color: var(--c-text-muted); font-size: 0.88rem; padding: 0.5rem 0; }
    .ia-erro {
      display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;
      padding: 0.6rem 0.8rem; background: var(--c-danger-soft); color: var(--c-danger);
      border-radius: var(--r-sm); font-size: 0.85rem;
    }
    .ia-erro mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .ia-dica { color: var(--c-text-muted); font-size: 0.85rem; margin: 0.25rem 0 0; }
    .ia-saida {
      margin-top: 0.5rem; padding: 0.875rem 1rem;
      background: var(--c-surface-2); border: 1px solid var(--c-border);
      border-radius: var(--r-md); border-left: 3px solid var(--c-primary);
    }
    .ia-saida-titulo { font-weight: 650; font-size: 0.85rem; color: var(--c-primary); margin-bottom: 0.35rem; }
    .ia-saida-texto { margin: 0; white-space: pre-wrap; line-height: 1.55; color: var(--c-text); font-size: 0.9rem; }
    .ia-saida-texto code {
      background: var(--c-primary-soft); color: var(--c-primary-strong);
      padding: 1px 5px; border-radius: 5px; font-size: 0.85em;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Anomalias */
    .anomalias { display: flex; flex-direction: column; gap: 0.625rem; }
    .anomalia {
      display: flex; gap: 0.75rem; align-items: flex-start;
      padding: 0.75rem 0.875rem; border: 1px solid var(--c-border);
      border-radius: var(--r-md); background: var(--c-surface);
    }
    .anomalia-icon {
      width: 36px; height: 36px; flex-shrink: 0; border-radius: var(--r-md);
      display: grid; place-items: center;
      background: var(--c-warning-soft); color: var(--c-warning);
    }
    .anomalia-pico .anomalia-icon { background: var(--c-danger-soft); color: var(--c-danger); }
    .anomalia-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .anomalia-corpo { flex: 1; }
    .anomalia-topo { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .tag {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 999px;
      background: var(--c-surface-2); color: var(--c-text-muted); border: 1px solid var(--c-border);
    }
    .anomalia-desc { font-size: 0.83rem; color: var(--c-text-muted); margin-top: 2px; }
  `,
})
export class DashboardPage {
  protected auth = inject(AuthService);
  private previsaoService = inject(PrevisaoService);
  private produtoService = inject(ProdutoService);
  private analiseService = inject(AnaliseService);
  private ia = inject(IaService);

  private readonly brl = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
  private readonly brlCompact = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  readonly loading = signal(true);
  readonly sugestoes = signal<Previsao[]>([]);
  readonly baixoEstoque = signal<Produto[]>([]);
  readonly produtos = signal<Produto[]>([]);
  readonly anomalias = signal<Anomalia[]>([]);

  // Inteligência (IA) sob demanda
  readonly iaTitulo = signal<string>('');
  readonly iaTexto = signal<string | null>(null);
  readonly iaCarregando = signal(false);
  readonly iaErro = signal<string | null>(null);

  readonly colunas = ['produto', 'atual', 'consumo', 'ruptura', 'sugerido', 'motivo'];
  readonly colunasBaixo = ['codigo', 'nome', 'qtd', 'min'];

  gerarResumo(): void {
    this.executarIa('Resumo executivo', this.ia.resumo());
  }

  gerarPedido(): void {
    this.executarIa('Pedido de compra', this.ia.pedidoCompra());
  }

  private executarIa(titulo: string, obs: Observable<{ resposta: string }>): void {
    if (this.iaCarregando()) return;
    this.iaTitulo.set(titulo);
    this.iaTexto.set(null);
    this.iaErro.set(null);
    this.iaCarregando.set(true);
    obs.subscribe({
      next: (r) => {
        this.iaTexto.set(r.resposta);
        this.iaCarregando.set(false);
      },
      error: (err) => {
        this.iaCarregando.set(false);
        this.iaErro.set(err?.error?.message ?? 'Não consegui falar com a IA. Verifique a chave da DeepSeek.');
      },
    });
  }

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
    return arr.slice(0, 6);
  });

  readonly topValor = computed(() =>
    this.produtos()
      .filter((p) => p.ativo)
      .map((p) => ({ nome: p.nome, valor: (p.precoUnitario ?? 0) * (p.quantidade ?? 0) }))
      .filter((p) => p.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8),
  );

  // ── Gráfico: Saúde do estoque (donut) ──────────────────────────
  readonly healthChart = computed(() => {
    const total = this.totalAtivos();
    return {
      series: [this.saudaveis(), this.baixoCount()] as ApexNonAxisChartSeries,
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: FONT,
        animations: { speed: 500 },
      } as ApexChart,
      labels: ['Saudável', 'Baixo estoque'],
      colors: ['#0e9f6e', '#f5a623'],
      stroke: { width: 0 } as ApexStroke,
      dataLabels: { enabled: false } as ApexDataLabels,
      legend: {
        position: 'bottom',
        fontFamily: FONT,
        fontSize: '13px',
        markers: { size: 6 },
        itemMargin: { horizontal: 10 },
      } as ApexLegend,
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { fontFamily: FONT, fontSize: '13px', color: '#6b7280' },
              value: {
                fontFamily: FONT,
                fontSize: '28px',
                fontWeight: 700,
                color: '#18181b',
                offsetY: 4,
              },
              total: {
                show: true,
                label: 'Total ativos',
                fontFamily: FONT,
                fontSize: '13px',
                color: '#6b7280',
                formatter: () => String(total),
              },
            },
          },
        },
      } as ApexPlotOptions,
      tooltip: { enabled: true, fillSeriesColor: false } as ApexTooltip,
    };
  });

  // ── Gráfico: Produtos por categoria (barras horizontais) ───────
  readonly catChart = computed(() => {
    const cats = this.categorias();
    return {
      series: [{ name: 'Produtos', data: cats.map((c) => c.count) }] as ApexAxisChartSeries,
      chart: {
        type: 'bar',
        height: 300,
        fontFamily: FONT,
        toolbar: { show: false },
        animations: { speed: 500 },
      } as ApexChart,
      colors: PALETTE,
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          distributed: true,
          barHeight: '62%',
        },
      } as ApexPlotOptions,
      dataLabels: {
        enabled: true,
        style: { fontFamily: FONT, fontWeight: 700, colors: ['#fff'] },
        offsetX: -4,
      } as ApexDataLabels,
      xaxis: {
        categories: cats.map((c) => c.nome),
        labels: { style: { fontFamily: FONT, colors: '#9aa0aa' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      } as ApexXAxis,
      yaxis: {
        labels: { style: { fontFamily: FONT, colors: '#6b7280', fontSize: '13px' } },
      } as ApexYAxis,
      grid: { borderColor: '#ececf0', strokeDashArray: 4, padding: { left: 4 } } as ApexGrid,
      legend: { show: false } as ApexLegend,
      tooltip: { enabled: true, y: { title: { formatter: () => 'Produtos:' } } } as ApexTooltip,
    };
  });

  // ── Gráfico: Top produtos por valor (colunas com gradiente) ────
  readonly valorChart = computed(() => {
    const tops = this.topValor();
    const fmt = this.brl;
    const fmtC = this.brlCompact;
    return {
      series: [{ name: 'Valor em estoque', data: tops.map((t) => Math.round(t.valor)) }] as ApexAxisChartSeries,
      chart: {
        type: 'bar',
        height: 320,
        fontFamily: FONT,
        toolbar: { show: false },
        animations: { speed: 500 },
      } as ApexChart,
      colors: ['#1d3f8f'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          gradientToColors: ['#3f6fd1'],
          stops: [0, 100],
          opacityFrom: 1,
          opacityTo: 0.85,
        },
      } as ApexFill,
      plotOptions: {
        bar: { horizontal: false, borderRadius: 6, borderRadiusApplication: 'end', columnWidth: '52%' },
      } as ApexPlotOptions,
      dataLabels: { enabled: false } as ApexDataLabels,
      xaxis: {
        categories: tops.map((t) => t.nome),
        labels: {
          style: { fontFamily: FONT, colors: '#6b7280', fontSize: '12px' },
          rotate: -25,
          trim: true,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      } as ApexXAxis,
      yaxis: {
        labels: {
          style: { fontFamily: FONT, colors: '#9aa0aa' },
          formatter: (v: number) => fmtC.format(v),
        },
      } as ApexYAxis,
      grid: { borderColor: '#ececf0', strokeDashArray: 4 } as ApexGrid,
      tooltip: {
        enabled: true,
        y: { formatter: (v: number) => fmt.format(v) },
      } as ApexTooltip,
    };
  });

  constructor() {
    forkJoin({
      sugestoes: this.previsaoService.reposicaoSugerida(),
      baixoEstoque: this.produtoService.baixoEstoque(),
      produtos: this.produtoService.listar({ size: 500 }),
      anomalias: this.analiseService.anomalias(),
    }).subscribe({
      next: ({ sugestoes, baixoEstoque, produtos, anomalias }) => {
        this.sugestoes.set(sugestoes);
        this.baixoEstoque.set(baixoEstoque);
        this.produtos.set(produtos.content);
        this.anomalias.set(anomalias);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
