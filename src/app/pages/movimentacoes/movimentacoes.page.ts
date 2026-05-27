import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Movimentacao, TipoMovimentacao } from '../../models/movimentacao.model';
import { Produto } from '../../models/produto.model';
import { MovimentacaoService } from '../../services/movimentacao.service';
import { ProdutoService } from '../../services/produto.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Movimentações"
        subtitle="Registre entradas e saídas de estoque"
        icon="swap_horiz"
      ></app-page-header>

      <div class="grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Registrar movimentação</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <mat-form-field appearance="outline">
                <mat-label>Produto</mat-label>
                <mat-select formControlName="produtoId">
                  @for (p of produtos(); track p.id) {
                    <mat-option [value]="p.id">
                      {{ p.codigo }} — {{ p.nome }} (qtd: {{ p.quantidade }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-button-toggle-group formControlName="tipo" class="toggle">
                <mat-button-toggle value="ENTRADA">
                  <mat-icon>add_circle</mat-icon> Entrada
                </mat-button-toggle>
                <mat-button-toggle value="SAIDA">
                  <mat-icon>remove_circle</mat-icon> Saída
                </mat-button-toggle>
              </mat-button-toggle-group>

              <mat-form-field appearance="outline">
                <mat-label>Quantidade</mat-label>
                <input matInput type="number" formControlName="quantidade" min="1" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Observação (opcional)</mat-label>
                <input matInput formControlName="observacao" maxlength="255" />
              </mat-form-field>

              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="form.invalid || saving()"
              >
                {{ saving() ? 'Registrando...' : 'Registrar' }}
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Histórico</mat-card-title>
            <mat-card-subtitle>
              {{ produtoSelecionado() ? produtoSelecionado()?.nome : 'Selecione um produto' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loadingHist()) {
              <div class="loading"><mat-spinner /></div>
            } @else if (!form.controls.produtoId.value) {
              <app-empty-state
                icon="touch_app"
                title="Selecione um produto"
                description="Escolha um produto no formulário ao lado para visualizar o histórico de movimentações."
              ></app-empty-state>
            } @else if (historico().length === 0) {
              <app-empty-state
                icon="history"
                title="Sem movimentações"
                description="Este produto ainda não teve nenhuma entrada ou saída registrada."
              ></app-empty-state>
            } @else {
              <table mat-table [dataSource]="historico()" class="tabela">
                <ng-container matColumnDef="data">
                  <th mat-header-cell *matHeaderCellDef>Data/Hora</th>
                  <td mat-cell *matCellDef="let m">{{ m.dataHora | date: 'dd/MM HH:mm' }}</td>
                </ng-container>

                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef>Tipo</th>
                  <td mat-cell *matCellDef="let m">
                    <mat-chip [class.entrada]="m.tipo === 'ENTRADA'" [class.saida]="m.tipo === 'SAIDA'">
                      {{ m.tipo }}
                    </mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="qtd">
                  <th mat-header-cell *matHeaderCellDef>Qtd</th>
                  <td mat-cell *matCellDef="let m">{{ m.quantidade }}</td>
                </ng-container>

                <ng-container matColumnDef="preco">
                  <th mat-header-cell *matHeaderCellDef>Preço época</th>
                  <td mat-cell *matCellDef="let m">
                    {{ m.precoUnitarioNaEpoca ? (m.precoUnitarioNaEpoca | currency: 'BRL') : '—' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="usuario">
                  <th mat-header-cell *matHeaderCellDef>Por</th>
                  <td mat-cell *matCellDef="let m">{{ m.usuarioNome || '—' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="colunas"></tr>
                <tr mat-row *matRowDef="let row; columns: colunas"></tr>
              </table>

              <mat-paginator
                [length]="totalElements()"
                [pageSize]="pageSize()"
                [pageIndex]="pageIndex()"
                [pageSizeOptions]="[10, 20, 50]"
                (page)="onPage($event)"
              ></mat-paginator>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: minmax(320px, 420px) 1fr;
      gap: 1rem;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
    form { display: flex; flex-direction: column; gap: 0.5rem; }
    mat-form-field { width: 100%; }
    .toggle { display: flex; margin-bottom: 0.5rem; }
    .toggle mat-button-toggle { flex: 1; }
    .tabela { width: 100%; }
    .entrada { background: var(--c-success-soft) !important; color: var(--c-success) !important; }
    .saida { background: var(--c-danger-soft) !important; color: var(--c-danger) !important; }
    .loading { padding: 2rem; display: grid; place-items: center; }
  `,
})
export class MovimentacoesPage {
  private fb = inject(FormBuilder);
  private produtoService = inject(ProdutoService);
  private movService = inject(MovimentacaoService);
  private snack = inject(MatSnackBar);

  readonly colunas = ['data', 'tipo', 'qtd', 'preco', 'usuario'];
  readonly produtos = signal<Produto[]>([]);
  readonly historico = signal<Movimentacao[]>([]);
  readonly saving = signal(false);
  readonly loadingHist = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  readonly form = this.fb.nonNullable.group({
    produtoId: [null as number | null, [Validators.required]],
    tipo: ['ENTRADA' as TipoMovimentacao, [Validators.required]],
    quantidade: [1, [Validators.required, Validators.min(1)]],
    observacao: [''],
  });

  produtoSelecionado(): Produto | null {
    const id = this.form.controls.produtoId.value;
    return this.produtos().find((p) => p.id === id) ?? null;
  }

  constructor() {
    this.produtoService.listar({ size: 200 }).subscribe((p) =>
      this.produtos.set(p.content.filter((x) => x.ativo)),
    );

    this.form.controls.produtoId.valueChanges.subscribe((id) => {
      if (id) {
        this.pageIndex.set(0);
        this.carregarHistorico();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const body = this.form.getRawValue() as {
      produtoId: number;
      tipo: TipoMovimentacao;
      quantidade: number;
      observacao?: string;
    };
    this.movService.registrar(body).subscribe({
      next: () => {
        this.snack.open('Movimentação registrada', 'OK', { duration: 2000 });
        this.form.patchValue({ quantidade: 1, observacao: '' });
        this.saving.set(false);
        this.carregarHistorico();
        this.produtoService.listar({ size: 200 }).subscribe((p) =>
          this.produtos.set(p.content.filter((x) => x.ativo)),
        );
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err.error?.message ?? 'Erro', 'Fechar', { duration: 4000 });
      },
    });
  }

  carregarHistorico(): void {
    const id = this.form.controls.produtoId.value;
    if (!id) return;
    this.loadingHist.set(true);
    this.movService.listarPorProduto(id, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.historico.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loadingHist.set(false);
      },
      error: () => this.loadingHist.set(false),
    });
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.carregarHistorico();
  }
}
