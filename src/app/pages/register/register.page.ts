import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <aside class="auth-aside">
        <div class="brand">
          <img src="unitins_estoque.png" alt="Unitins Estoque" class="brand-logo" />
        </div>

        <div class="aside-body">
          <h2 class="aside-title">Comece a controlar seu estoque hoje</h2>
          <p class="aside-text">
            Crie sua conta em segundos e tenha visão completa do catálogo, movimentações e previsões.
          </p>
          <ul class="features">
            <li><mat-icon>inventory_2</mat-icon> Catálogo organizado por categorias</li>
            <li><mat-icon>insights</mat-icon> Alertas de estoque baixo</li>
            <li><mat-icon>lock</mat-icon> Acesso seguro com autenticação</li>
          </ul>
        </div>

        <div class="aside-foot">v0.0.1 — beta</div>
      </aside>

      <main class="auth-main">
        <div class="auth-card">
          <h1 class="welcome">Criar conta</h1>
          <p class="subtitle">Acesso padrão: <strong>USUÁRIO</strong></p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="nome" autocomplete="name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="username" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Senha (mín. 6)</mat-label>
              <input matInput type="password" formControlName="senha" autocomplete="new-password" />
            </mat-form-field>

            @if (erro()) {
              <div class="erro">
                <mat-icon>error</mat-icon>
                <span>{{ erro() }}</span>
              </div>
            }

            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || loading()"
              class="botao-entrar"
            >
              {{ loading() ? 'Criando...' : 'Criar conta' }}
            </button>

            <p class="rodape">
              Já tem conta? <a routerLink="/login">Entrar</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: `
    .auth {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      background: var(--c-surface);
    }

    .auth-aside {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2.5rem;
      color: #fff;
      background:
        radial-gradient(1200px 400px at -10% -20%, rgba(255,255,255,0.16), transparent 60%),
        linear-gradient(150deg, #4f4fc4 0%, #5b5bd6 45%, #7c5cf0 100%);
    }

    .auth-aside::after {
      content: '';
      position: absolute;
      right: -120px;
      bottom: -120px;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
    }

    .brand {
      position: relative;
      z-index: 1;
      align-self: flex-start;
      background: #fff;
      border-radius: var(--r-lg);
      padding: 0.875rem 1.125rem;
      box-shadow: var(--shadow-md);
    }

    .brand-logo {
      display: block;
      width: 152px;
      height: auto;
    }

    .aside-body {
      position: relative;
      z-index: 1;
      max-width: 420px;
    }

    .aside-title {
      font-size: 1.875rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.2;
      color: #fff;
      margin: 0 0 0.875rem;
    }

    .aside-text {
      font-size: 0.95rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.82);
      margin: 0 0 2rem;
    }

    .features {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .features li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.92);
    }

    .features mat-icon {
      font-size: 20px; width: 20px; height: 20px;
      padding: 6px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.14);
    }

    .aside-foot {
      position: relative;
      z-index: 1;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .auth-main {
      display: grid;
      place-items: center;
      padding: 2rem;
    }

    .auth-card {
      width: 100%;
      max-width: 380px;
    }

    .welcome {
      font-size: 1.625rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0 0 0.375rem;
    }

    .subtitle {
      color: var(--c-text-muted);
      margin: 0 0 2rem;
      font-size: 0.9rem;
    }

    form { display: flex; flex-direction: column; gap: 0.25rem; }
    mat-form-field { width: 100%; }

    .botao-entrar {
      height: 46px !important;
      margin-top: 0.75rem !important;
      font-size: 0.9375rem !important;
    }

    .erro {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      background: var(--c-danger-soft);
      color: var(--c-danger);
      border-radius: var(--r-md);
      font-size: 0.85rem;
      margin: 0.5rem 0 0.25rem;
    }

    .erro mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .rodape {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--c-text-muted);
    }

    .rodape a {
      color: var(--c-primary);
      text-decoration: none;
      font-weight: 600;
    }

    .rodape a:hover { text-decoration: underline; }

    @media (max-width: 880px) {
      .auth { grid-template-columns: 1fr; }
      .auth-aside { display: none; }
    }
  `,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.erro.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.snack.open('Conta criada! Faça login.', 'OK', { duration: 3000 });
        this.router.navigateByUrl('/login');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.erro.set(err.error?.message ?? err.error ?? 'Erro ao criar conta');
      },
    });
  }
}
