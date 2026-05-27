import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Categorias"
        subtitle="Agrupe seus produtos por categoria"
        icon="category"
      >
        @if (auth.isAdmin()) {
          <button mat-flat-button color="primary" routerLink="/categorias/nova">
            <mat-icon>add</mat-icon> Nova categoria
          </button>
        }
      </app-page-header>

      <mat-card>
        @if (loading()) {
          <div class="loading"><mat-spinner /></div>
        } @else if (dados().length === 0) {
          <app-empty-state
            icon="category"
            title="Nenhuma categoria ainda"
            description="Crie a primeira categoria para começar a organizar seus produtos."
          >
            @if (auth.isAdmin()) {
              <button mat-flat-button color="primary" routerLink="/categorias/nova">
                <mat-icon>add</mat-icon> Criar categoria
              </button>
            }
          </app-empty-state>
        } @else {
          <table mat-table [dataSource]="dados()" class="tabela">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let c">{{ c.id }}</td>
            </ng-container>

            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let c">{{ c.nome }}</td>
            </ng-container>

            <ng-container matColumnDef="descricao">
              <th mat-header-cell *matHeaderCellDef>Descrição</th>
              <td mat-cell *matCellDef="let c">{{ c.descricao || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef class="acoes"></th>
              <td mat-cell *matCellDef="let c" class="acoes">
                @if (auth.isAdmin()) {
                  <button mat-icon-button [routerLink]="['/categorias', c.id]" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="confirmDelete(c)" matTooltip="Excluir">
                    <mat-icon>delete</mat-icon>
                  </button>
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
      </mat-card>
    </div>
  `,
  styles: `
    .tabela { width: 100%; }
    .acoes { width: 120px; text-align: right; }
    .loading { padding: 3rem; display: grid; place-items: center; }
  `,
})
export class CategoriasListPage {
  private service = inject(CategoriaService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  protected auth = inject(AuthService);

  readonly colunas = ['id', 'nome', 'descricao', 'acoes'];
  readonly loading = signal(true);
  readonly dados = signal<Categoria[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly totalElements = signal(0);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.service.listar(this.pageIndex(), this.pageSize()).subscribe({
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

  confirmDelete(c: Categoria): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir categoria',
          message: `Confirma excluir "${c.nome}"?`,
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.service.deletar(c.id).subscribe({
            next: () => {
              this.snack.open('Categoria excluída', 'OK', { duration: 2000 });
              this.carregar();
            },
            error: (err) => {
              this.snack.open(err.error?.message ?? 'Erro ao excluir', 'Fechar', {
                duration: 4000,
              });
            },
          });
        }
      });
  }
}
