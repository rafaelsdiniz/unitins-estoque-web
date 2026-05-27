import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria.service';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
        <h1>{{ editando() ? 'Editar produto' : 'Novo produto' }}</h1>
      </header>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
            <mat-form-field appearance="outline" class="span2">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="nome" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="span2">
              <mat-label>Descrição</mat-label>
              <textarea matInput formControlName="descricao" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Preço unitário</mat-label>
              <input matInput type="number" step="0.01" formControlName="precoUnitario" />
              <span matTextPrefix>R$&nbsp;</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoria</mat-label>
              <mat-select formControlName="categoriaId">
                <mat-option [value]="null">— Sem categoria —</mat-option>
                @for (c of categorias(); track c.id) {
                  <mat-option [value]="c.id">{{ c.nome }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estoque mínimo</mat-label>
              <input matInput type="number" formControlName="estoqueMinimo" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tempo de reposição (dias)</mat-label>
              <input matInput type="number" formControlName="tempoReposicaoDias" />
            </mat-form-field>

            <div class="actions span2">
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
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem 1rem;
      max-width: 800px;
    }
    .span2 { grid-column: span 2; }
    mat-form-field { width: 100%; }
    .actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }
  `,
})
export class ProdutoFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ProdutoService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  readonly id = input<string | undefined>();
  readonly editando = signal(false);
  readonly saving = signal(false);
  readonly categorias = signal<Categoria[]>([]);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: [''],
    precoUnitario: [0, [Validators.required, Validators.min(0)]],
    estoqueMinimo: [0, [Validators.min(0)]],
    tempoReposicaoDias: [null as number | null],
    categoriaId: [null as number | null],
  });

  ngOnInit(): void {
    this.categoriaService.listar(0, 200).subscribe((p) => this.categorias.set(p.content));

    const idStr = this.id();
    if (idStr) {
      this.editando.set(true);
      this.service.buscar(+idStr).subscribe((p) => {
        this.form.patchValue({
          nome: p.nome,
          descricao: p.descricao ?? '',
          precoUnitario: p.precoUnitario,
          estoqueMinimo: p.estoqueMinimo,
          tempoReposicaoDias: p.tempoReposicaoDias ?? null,
          categoriaId: p.categoriaId ?? null,
        });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const body = {
      nome: raw.nome,
      descricao: raw.descricao || undefined,
      precoUnitario: raw.precoUnitario,
      estoqueMinimo: raw.estoqueMinimo,
      tempoReposicaoDias: raw.tempoReposicaoDias ?? undefined,
      categoriaId: raw.categoriaId ?? undefined,
    };
    const op = this.editando()
      ? this.service.atualizar(+this.id()!, body)
      : this.service.criar(body);

    op.subscribe({
      next: () => {
        this.snack.open(this.editando() ? 'Atualizado' : 'Criado', 'OK', { duration: 2000 });
        this.router.navigateByUrl('/produtos');
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err.error?.message ?? 'Erro ao salvar', 'Fechar', { duration: 4000 });
      },
    });
  }

  voltar(): void {
    this.router.navigateByUrl('/produtos');
  }
}
