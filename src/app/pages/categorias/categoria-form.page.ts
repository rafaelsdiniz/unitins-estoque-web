import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="header">
        <button mat-icon-button (click)="voltar()" aria-label="Voltar">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ editando() ? 'Editar categoria' : 'Nova categoria' }}</h1>
      </header>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="nome" maxlength="100" />
              @if (form.controls.nome.touched && form.controls.nome.invalid) {
                <mat-error>Nome obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Descrição (opcional)</mat-label>
              <textarea matInput formControlName="descricao" rows="3" maxlength="255"></textarea>
            </mat-form-field>

            <div class="actions">
              <button mat-button type="button" (click)="voltar()">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
    h1 { margin: 0; }
    form { display: flex; flex-direction: column; gap: 0.5rem; }
    mat-form-field { width: 100%; max-width: 600px; }
    .actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; max-width: 600px; }
  `,
})
export class CategoriaFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CategoriaService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  readonly id = input<string | undefined>();
  readonly editando = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    const idStr = this.id();
    if (idStr) {
      this.editando.set(true);
      this.service.buscar(+idStr).subscribe((c) => {
        this.form.patchValue({ nome: c.nome, descricao: c.descricao ?? '' });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const body = this.form.getRawValue();
    const op = this.editando()
      ? this.service.atualizar(+this.id()!, body)
      : this.service.criar(body);

    op.subscribe({
      next: () => {
        this.snack.open(this.editando() ? 'Atualizada' : 'Criada', 'OK', { duration: 2000 });
        this.router.navigateByUrl('/categorias');
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err.error?.message ?? 'Erro ao salvar', 'Fechar', { duration: 4000 });
      },
    });
  }

  voltar(): void {
    this.router.navigateByUrl('/categorias');
  }
}
