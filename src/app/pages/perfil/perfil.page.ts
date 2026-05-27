import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Meu perfil"
        subtitle="Suas informações e configurações"
        icon="person"
      ></app-page-header>

      @if (auth.me(); as me) {
        <div class="grid">
          <!-- Identidade -->
          <mat-card class="identity">
            <div class="cover"></div>
            <div class="identity-body">
              <div class="avatar">{{ initials() }}</div>
              <div class="nome">{{ me.nome }}</div>
              <div class="email">{{ me.email }}</div>

              <span class="role-pill" [class.admin]="me.role === 'ADMIN'">
                <mat-icon>{{ me.role === 'ADMIN' ? 'verified_user' : 'person' }}</mat-icon>
                {{ me.role }}
              </span>

              <div class="meta">
                <div class="meta-item">
                  <span class="k"><mat-icon>tag</mat-icon> ID da conta</span>
                  <span class="v">#{{ me.id }}</span>
                </div>
                <div class="meta-item">
                  <span class="k"><mat-icon>badge</mat-icon> Nível de acesso</span>
                  <span class="v">{{ me.role === 'ADMIN' ? 'Administrador' : 'Usuário' }}</span>
                </div>
                <div class="meta-item">
                  <span class="k"><mat-icon>check_circle</mat-icon> Status</span>
                  <span class="v status" [class.ok]="me.ativo"><i class="dot"></i> {{ me.ativo ? 'Ativa' : 'Inativa' }}</span>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Configurações -->
          <mat-card class="settings">
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="submit()">
                <section class="block">
                  <h3 class="block-title"><mat-icon>person</mat-icon> Informações da conta</h3>
                  <p class="block-desc">Atualize seu nome e o e-mail usado para entrar.</p>
                  <div class="fields">
                    <mat-form-field appearance="outline">
                      <mat-label>Nome</mat-label>
                      <input matInput formControlName="nome" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>E-mail</mat-label>
                      <input matInput type="email" formControlName="email" />
                    </mat-form-field>
                  </div>
                </section>

                <div class="divider"></div>

                <section class="block">
                  <h3 class="block-title"><mat-icon>lock</mat-icon> Segurança</h3>
                  <p class="block-desc">Deixe em branco para manter a senha atual.</p>
                  <mat-form-field appearance="outline" class="full">
                    <mat-label>Nova senha</mat-label>
                    <input matInput type="password" formControlName="novaSenha" autocomplete="new-password" />
                    @if (form.controls.novaSenha.touched && form.controls.novaSenha.invalid) {
                      <mat-error>Mínimo 6 caracteres</mat-error>
                    }
                  </mat-form-field>
                </section>

                <div class="actions">
                  <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                    {{ saving() ? 'Salvando...' : 'Salvar alterações' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 860px) {
      .grid { grid-template-columns: 1fr; }
    }

    /* ── Identidade ──────────────────────────── */
    .identity {
      overflow: hidden;
      padding: 0 !important;
    }

    .cover {
      height: 96px;
      background:
        radial-gradient(420px 130px at 20% -40%, rgba(255,255,255,0.28), transparent 70%),
        var(--grad-primary);
    }

    .identity-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 1.5rem 1.75rem;
      margin-top: -39px;
    }

    .avatar {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      background: var(--grad-primary);
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      border: 4px solid var(--c-surface);
      box-shadow: var(--shadow-md);
    }

    .nome {
      font-size: 1.15rem;
      font-weight: 650;
      letter-spacing: -0.015em;
      margin-top: 0.875rem;
    }

    .email {
      font-size: 0.85rem;
      color: var(--c-text-muted);
      margin-top: 2px;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 0.875rem;
      padding: 4px 11px 4px 8px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: var(--c-surface-2);
      color: var(--c-text-muted);
    }

    .role-pill mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .role-pill.admin {
      background: var(--c-primary-soft);
      color: var(--c-primary-strong);
    }

    .meta {
      width: 100%;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--c-border);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.825rem;
    }

    .meta-item .k {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--c-text-muted);
    }

    .meta-item .k mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--c-text-soft);
    }

    .meta-item .v {
      font-weight: 600;
      color: var(--c-text);
    }

    .meta-item .v.status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--c-text-muted);
    }

    .meta-item .v.status .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--c-text-soft);
    }

    .meta-item .v.status.ok {
      color: var(--c-success);
    }

    .meta-item .v.status.ok .dot {
      background: var(--c-success);
      box-shadow: 0 0 0 3px var(--c-success-soft);
    }

    /* ── Configurações ───────────────────────── */
    .block-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 650;
      letter-spacing: -0.01em;
    }

    .block-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--c-text-muted);
    }

    .block-desc {
      font-size: 0.825rem;
      color: var(--c-text-muted);
      margin: 3px 0 1.125rem;
    }

    .fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
    }

    @media (max-width: 560px) {
      .fields { grid-template-columns: 1fr; }
    }

    .full { width: 100%; }
    mat-form-field { width: 100%; }

    .divider {
      height: 1px;
      background: var(--c-border);
      margin: 0.75rem 0 1.5rem;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  `,
})
export class PerfilPage implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private snack = inject(MatSnackBar);
  protected auth = inject(AuthService);

  readonly saving = signal(false);

  readonly initials = computed(() => {
    const nome = this.auth.me()?.nome ?? '';
    const parts = nome.trim().split(/\s+/);
    if (!parts[0]) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    novaSenha: ['', [Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const carregar = () => {
      const me = this.auth.me();
      if (me) {
        this.form.patchValue({ nome: me.nome, email: me.email });
      }
    };
    carregar();
    if (!this.auth.me()) {
      this.auth.loadMe().subscribe(carregar);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const me = this.auth.me();
    if (!me) return;

    this.saving.set(true);
    const body = this.form.getRawValue();
    this.usuarioService
      .atualizar(me.id, {
        nome: body.nome,
        email: body.email,
        novaSenha: body.novaSenha || undefined,
      })
      .subscribe({
        next: () => {
          this.snack.open('Perfil atualizado', 'OK', { duration: 2000 });
          this.form.patchValue({ novaSenha: '' });
          this.auth.loadMe().subscribe();
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(err.error?.message ?? 'Erro', 'Fechar', { duration: 4000 });
        },
      });
  }
}
