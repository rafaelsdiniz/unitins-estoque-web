import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Produto } from '../../models/produto.model';
import { ProdutoService } from '../../services/produto.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-produtos-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Produtos"
        subtitle="Gerencie seu catálogo"
        icon="inventory_2"
      >
        @if (auth.isAdmin()) {
          <button mat-flat-button color="primary" routerLink="/produtos/novo">
            <mat-icon>add</mat-icon> Novo produto
          </button>
        }
      </app-page-header>

      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="busca">
            <mat-label>Buscar por nome</mat-label>
            <input matInput [formControl]="busca" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          @if (loading()) {
            <div class="loading"><mat-spinner /></div>
          } @else if (dados().length === 0) {
            <app-empty-state
              icon="inventory_2"
              title="Nenhum produto encontrado"
              [description]="busca.value ? 'Tente outro termo de busca.' : 'Cadastre o primeiro produto para começar.'"
            >
              @if (auth.isAdmin() && !busca.value) {
                <button mat-flat-button color="primary" routerLink="/produtos/novo">
                  <mat-icon>add</mat-icon> Novo produto
                </button>
              }
            </app-empty-state>
          } @else {
            <table mat-table [dataSource]="dados()" class="tabela">
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef>Código</th>
                <td mat-cell *matCellDef="let p">{{ p.codigo }}</td>
              </ng-container>

              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let p">{{ p.nome }}</td>
              </ng-container>

              <ng-container matColumnDef="categoria">
                <th mat-header-cell *matHeaderCellDef>Categoria</th>
                <td mat-cell *matCellDef="let p">{{ p.categoriaNome || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="preco">
                <th mat-header-cell *matHeaderCellDef>Preço</th>
                <td mat-cell *matCellDef="let p">
                  {{ p.precoUnitario | currency: 'BRL' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="quantidade">
                <th mat-header-cell *matHeaderCellDef>Qtd</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class.baixo]="p.quantidade < p.estoqueMinimo">
                    {{ p.quantidade }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class.ok]="p.ativo" [class.inativo]="!p.ativo">
                    {{ p.ativo ? 'Ativo' : 'Inativo' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef class="acoes"></th>
                <td mat-cell *matCellDef="let p" class="acoes">
                  @if (auth.isAdmin()) {
                    <button mat-icon-button [routerLink]="['/produtos', p.id]" matTooltip="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    @if (p.ativo) {
                      <button mat-icon-button color="warn" (click)="confirmDesativar(p)" matTooltip="Desativar">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  }
                </td>
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
  `,
  styles: `
    .busca { width: 100%; max-width: 360px; }
    .tabela { width: 100%; }
    .acoes { width: 120px; text-align: right; }
    .baixo { background: var(--c-danger-soft) !important; color: var(--c-danger) !important; }
    .ok { background: var(--c-success-soft) !important; color: var(--c-success) !important; }
    .inativo { background: var(--c-surface-2) !important; color: var(--c-text-muted) !important; }
    .loading { padding: 3rem; display: grid; place-items: center; }
  `,
})
export class ProdutosListPage {
  private service = inject(ProdutoService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  protected auth = inject(AuthService);

  readonly colunas = ['codigo', 'nome', 'categoria', 'preco', 'quantidade', 'status', 'acoes'];
  readonly busca = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly dados = signal<Produto[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  constructor() {
    this.carregar();
    this.busca.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex.set(0);
      this.carregar();
    });
  }

  carregar(): void {
    this.loading.set(true);
    this.service
      .listar({
        page: this.pageIndex(),
        size: this.pageSize(),
        nome: this.busca.value || undefined,
      })
      .subscribe({
        next: (page) => {
          this.dados.set(page.content);
          this.totalElements.set(page.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.carregar();
  }

  confirmDesativar(p: Produto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar produto',
          message: `Confirma desativar "${p.nome}"? Movimentações ficarão preservadas.`,
          destructive: true,
          confirmLabel: 'Desativar',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.service.desativar(p.id).subscribe({
            next: () => {
              this.snack.open('Desativado', 'OK', { duration: 2000 });
              this.carregar();
            },
            error: (err) =>
              this.snack.open(err.error?.message ?? 'Erro', 'Fechar', { duration: 4000 }),
          });
        }
      });
  }
}
