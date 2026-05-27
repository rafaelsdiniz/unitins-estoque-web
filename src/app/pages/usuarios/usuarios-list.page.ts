import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Usuários"
        subtitle="Gerenciar contas e permissões"
        icon="group"
      ></app-page-header>

      <mat-card>
        @if (loading()) {
          <div class="loading"><mat-spinner /></div>
        } @else {
          <table mat-table [dataSource]="dados()" class="tabela">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let u">{{ u.id }}</td>
            </ng-container>

            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let u">{{ u.nome }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>E-mail</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip [class.admin]="u.role === 'ADMIN'">{{ u.role }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip [class.ok]="u.ativo" [class.inativo]="!u.ativo">
                  {{ u.ativo ? 'Ativo' : 'Inativo' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="data">
              <th mat-header-cell *matHeaderCellDef>Cadastro</th>
              <td mat-cell *matCellDef="let u">
                {{ u.dataCriacao | date: 'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef class="acoes"></th>
              <td mat-cell *matCellDef="let u" class="acoes">
                @if (u.ativo) {
                  <button mat-icon-button color="warn" (click)="confirmDesativar(u)" matTooltip="Desativar">
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
    .acoes { width: 80px; text-align: right; }
    .admin { background: var(--c-primary-soft) !important; color: var(--c-primary-strong) !important; }
    .ok { background: var(--c-success-soft) !important; color: var(--c-success) !important; }
    .inativo { background: var(--c-surface-2) !important; color: var(--c-text-muted) !important; }
    .loading { padding: 3rem; display: grid; place-items: center; }
  `,
})
export class UsuariosListPage {
  private service = inject(UsuarioService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly colunas = ['id', 'nome', 'email', 'role', 'status', 'data', 'acoes'];
  readonly loading = signal(true);
  readonly dados = signal<Usuario[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
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

  confirmDesativar(u: Usuario): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar usuário',
          message: `Confirma desativar "${u.nome}"?`,
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.service.desativar(u.id).subscribe({
            next: () => {
              this.snack.open('Usuário desativado', 'OK', { duration: 2000 });
              this.carregar();
            },
            error: (err) =>
              this.snack.open(err.error?.message ?? 'Erro', 'Fechar', { duration: 4000 }),
          });
        }
      });
  }
}
