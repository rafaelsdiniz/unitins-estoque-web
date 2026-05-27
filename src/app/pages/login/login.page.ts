import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <div class="card">
        <img src="unitins_estoque.png" alt="Unitins Estoque" class="logo" />

        <h1 class="welcome">Bem-vindo de volta</h1>
        <p class="subtitle">Entre na sua conta para continuar</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="email" class="label">E-mail</label>
            <div
              class="input-wrap"
              [class.invalid]="form.controls.email.touched && form.controls.email.invalid"
            >
              <mat-icon class="lead">mail</mat-icon>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="username"
                placeholder="voce@unitins.br"
              />
            </div>
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="hint-error">Informe um e-mail válido</span>
            }
          </div>

          <div class="field">
            <label for="senha" class="label">Senha</label>
            <div
              class="input-wrap"
              [class.invalid]="form.controls.senha.touched && form.controls.senha.invalid"
            >
              <mat-icon class="lead">lock</mat-icon>
              <input
                id="senha"
                [type]="hide() ? 'password' : 'text'"
                formControlName="senha"
                autocomplete="current-password"
                placeholder="Sua senha"
              />
              <button
                type="button"
                class="eye"
                (click)="hide.set(!hide())"
                [attr.aria-label]="hide() ? 'Mostrar senha' : 'Ocultar senha'"
              >
                <mat-icon>{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (form.controls.senha.touched && form.controls.senha.invalid) {
              <span class="hint-error">Senha obrigatória</span>
            }
          </div>

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
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <span class="btn-inner">Entrar <mat-icon>arrow_forward</mat-icon></span>
            }
          </button>

          <p class="rodape">
            Ainda não tem conta?
            <a routerLink="/register">Criar agora</a>
          </p>
        </form>
      </div>

      <p class="copy">© Unitins · Sistema de Estoque · v0.0.1</p>
    </div>
  `,
  styles: `
    .auth {
      position: relative;
      overflow: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 1.5rem;
      background:
        radial-gradient(880px 480px at 85% 12%, rgba(245, 166, 35, 0.20), transparent 55%),
        radial-gradient(760px 560px at 8% 92%, rgba(80, 125, 225, 0.28), transparent 55%),
        linear-gradient(150deg, #0e224f 0%, #163275 55%, #1d3f8f 100%);

      --c-primary: #1d3f8f;
      --ring: 0 0 0 4px rgba(29, 63, 143, 0.14);
      --mat-sys-primary: #1d3f8f;
      --mat-sys-on-primary: #ffffff;
    }

    /* Anéis decorativos sutis (eco do emblema circular da logo) */
    .auth::before,
    .auth::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.06);
      pointer-events: none;
    }

    .auth::before { width: 520px; height: 520px; top: -180px; right: -140px; }
    .auth::after  { width: 640px; height: 640px; bottom: -260px; left: -200px; }

    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: var(--r-xl);
      padding: 2.5rem;
      box-shadow:
        0 30px 60px -20px rgba(8, 20, 51, 0.55),
        0 12px 28px -12px rgba(8, 20, 51, 0.40);
    }

    .logo {
      display: block;
      width: 190px;
      max-width: 70%;
      height: auto;
      margin: 0 auto 1.5rem;
    }

    .welcome {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-align: center;
      margin: 0 0 0.375rem;
    }

    .subtitle {
      text-align: center;
      color: var(--c-text-muted);
      font-size: 0.9rem;
      margin: 0 0 1.75rem;
    }

    form { display: flex; flex-direction: column; gap: 1.125rem; }

    /* ── Inputs customizados ─────────────────── */
    .field { display: flex; flex-direction: column; }

    .label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--c-text);
      margin-bottom: 0.4rem;
    }

    .input-wrap {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      height: 50px;
      padding: 0 0.875rem;
      background: #f5f7fc;
      border: 1.5px solid #e4e8f1;
      border-radius: 12px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }

    .input-wrap:focus-within {
      background: #fff;
      border-color: var(--c-primary);
      box-shadow: var(--ring);
    }

    .input-wrap.invalid {
      border-color: var(--c-danger);
      background: #fff;
    }

    .input-wrap.invalid:focus-within {
      box-shadow: 0 0 0 4px rgba(229, 72, 77, 0.14);
    }

    .input-wrap .lead {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--c-text-soft);
      flex-shrink: 0;
    }

    .input-wrap:focus-within .lead { color: var(--c-primary); }

    .input-wrap input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.9375rem;
      color: var(--c-text);
    }

    .input-wrap input::placeholder { color: var(--c-text-soft); }

    .eye {
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      color: var(--c-text-soft);
      flex-shrink: 0;
    }

    .eye:hover { color: var(--c-text-muted); }
    .eye mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .hint-error {
      font-size: 0.75rem;
      color: var(--c-danger);
      margin-top: 0.375rem;
    }

    /* ── Botão / erro / rodapé ───────────────── */
    .botao-entrar {
      height: 50px !important;
      margin-top: 0.25rem !important;
      font-size: 0.9375rem !important;
    }

    .btn-inner {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .botao-entrar mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .erro {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      background: var(--c-danger-soft);
      color: var(--c-danger);
      border-radius: var(--r-md);
      font-size: 0.85rem;
    }

    .erro mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .rodape {
      text-align: center;
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: var(--c-text-muted);
    }

    .rodape a {
      color: var(--c-primary);
      text-decoration: none;
      font-weight: 600;
    }

    .rodape a:hover { text-decoration: underline; }

    .copy {
      position: relative;
      z-index: 1;
      margin: 0;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    @media (max-width: 480px) {
      .card { padding: 1.75rem; }
    }
  `,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly hide = signal(true);
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.erro.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.auth.loadMe().subscribe();
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.erro.set(
          err.status === 401
            ? 'E-mail ou senha incorretos'
            : err.error?.message ?? 'Erro ao entrar',
        );
      },
      complete: () => this.loading.set(false),
    });
  }
}
