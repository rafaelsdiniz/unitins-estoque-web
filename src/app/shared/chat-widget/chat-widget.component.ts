import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from '../../models/ia.model';
import { IaService } from '../../services/ia.service';

/**
 * Chat de IA flutuante (canto inferior direito), presente em todas as páginas
 * autenticadas via main-layout. O histórico vive só na sessão (signal); o
 * backend é stateless. Veja IaService -> POST /ia/chat.
 */
@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="widget">
      @if (aberto()) {
        <div class="painel" role="dialog" aria-label="Assistente IA">
          <header class="painel-head">
            <div class="head-id">
              <div class="head-avatar"><mat-icon>smart_toy</mat-icon></div>
              <div>
                <div class="head-titulo">Assistente IA</div>
                <div class="head-sub">Dúvidas e estoque</div>
              </div>
            </div>
            <div class="head-acoes">
              @if (mensagens().length > 0) {
                <button class="icon-btn" (click)="limpar()" title="Nova conversa" aria-label="Nova conversa">
                  <mat-icon>restart_alt</mat-icon>
                </button>
              }
              <button class="icon-btn" (click)="aberto.set(false)" title="Fechar" aria-label="Fechar">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </header>

          <div class="mensagens" #scrollArea>
            @if (mensagens().length === 0) {
              <div class="vazio">
                <div class="vazio-icon"><mat-icon>auto_awesome</mat-icon></div>
                <p>Olá! Pergunte sobre o uso do sistema ou sobre o seu estoque.</p>
                <div class="sugestoes">
                  @for (s of sugestoes; track s) {
                    <button class="chip-sugestao" (click)="enviarTexto(s)">{{ s }}</button>
                  }
                </div>
              </div>
            }

            @for (m of mensagens(); track $index) {
              <div class="linha" [class.minha]="m.papel === 'user'">
                @if (m.papel === 'assistant') {
                  <div class="bot-avatar"><mat-icon>smart_toy</mat-icon></div>
                }
                <div class="bolha" [class.bolha-user]="m.papel === 'user'">{{ m.conteudo }}</div>
              </div>
            }

            @if (carregando()) {
              <div class="linha">
                <div class="bot-avatar"><mat-icon>smart_toy</mat-icon></div>
                <div class="bolha digitando"><span></span><span></span><span></span></div>
              </div>
            }
          </div>

          @if (erro()) {
            <div class="erro">
              <mat-icon>error_outline</mat-icon>
              <span>{{ erro() }}</span>
            </div>
          }

          <form class="composer" (ngSubmit)="enviar()">
            <textarea
              [formControl]="input"
              (keydown.enter)="onEnter($event)"
              placeholder="Digite sua pergunta…"
              rows="1"
              [disabled]="carregando()"
            ></textarea>
            <button
              type="submit"
              class="enviar-btn"
              [disabled]="carregando() || !input.value.trim()"
              aria-label="Enviar"
            >
              <mat-icon>send</mat-icon>
            </button>
          </form>
        </div>
      }

      <button class="fab" (click)="aberto.set(!aberto())" [class.fab-aberto]="aberto()" aria-label="Abrir assistente">
        <mat-icon>{{ aberto() ? 'keyboard_arrow_down' : 'smart_toy' }}</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .widget {
      position: fixed;
      right: 1.5rem;
      bottom: 1.5rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
    }

    /* Botão flutuante */
    .fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: var(--grad-primary);
      color: #fff;
      cursor: pointer;
      display: grid;
      place-items: center;
      box-shadow: 0 8px 24px rgba(29, 63, 143, 0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .fab:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(29, 63, 143, 0.42); }
    .fab:active { transform: translateY(0); }
    .fab mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .fab-aberto { box-shadow: 0 6px 18px rgba(29, 63, 143, 0.3); }

    /* Painel */
    .painel {
      width: 370px;
      height: 540px;
      max-height: calc(100vh - 7rem);
      display: flex;
      flex-direction: column;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: var(--r-lg);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
      overflow: hidden;
      animation: subir 0.16s ease;
    }
    @keyframes subir {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .painel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0.875rem;
      border-bottom: 1px solid var(--c-border);
      background: var(--c-surface);
    }
    .head-id { display: flex; align-items: center; gap: 0.5rem; }
    .head-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: var(--grad-primary); color: #fff;
      display: grid; place-items: center;
    }
    .head-avatar mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .head-titulo { font-size: 0.9rem; font-weight: 650; color: var(--c-text); line-height: 1.2; }
    .head-sub { font-size: 0.72rem; color: var(--c-text-muted); }
    .head-acoes { display: flex; gap: 2px; }
    .icon-btn {
      width: 32px; height: 32px; border: none; background: transparent;
      border-radius: var(--r-sm); color: var(--c-text-soft); cursor: pointer;
      display: grid; place-items: center; transition: background 0.13s ease, color 0.13s ease;
    }
    .icon-btn:hover { background: var(--c-surface-2); color: var(--c-text); }
    .icon-btn mat-icon { font-size: 19px; width: 19px; height: 19px; }

    .mensagens {
      flex: 1; overflow-y: auto; padding: 0.875rem;
      display: flex; flex-direction: column; gap: 0.625rem;
    }

    /* Estado vazio */
    .vazio { margin: auto; text-align: center; padding: 0.5rem; }
    .vazio-icon {
      width: 44px; height: 44px; border-radius: var(--r-md);
      background: var(--c-primary-soft); color: var(--c-primary);
      display: grid; place-items: center; margin: 0 auto 0.625rem;
    }
    .vazio-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .vazio p { font-size: 0.825rem; color: var(--c-text-muted); margin: 0 0 0.875rem; }
    .sugestoes { display: flex; flex-direction: column; gap: 0.375rem; }
    .chip-sugestao {
      font-family: inherit; font-size: 0.78rem; font-weight: 550;
      color: var(--c-text-muted); background: var(--c-surface-2);
      border: 1px solid var(--c-border); border-radius: var(--r-md);
      padding: 0.45rem 0.7rem; cursor: pointer; text-align: left;
      transition: background 0.13s ease, color 0.13s ease, border-color 0.13s ease;
    }
    .chip-sugestao:hover { background: var(--c-primary-soft); color: var(--c-primary-strong); border-color: var(--c-primary-soft); }

    /* Mensagens */
    .linha { display: flex; align-items: flex-end; gap: 0.4rem; }
    .linha.minha { justify-content: flex-end; }
    .bot-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--grad-primary); color: #fff;
      display: grid; place-items: center; flex-shrink: 0;
    }
    .bot-avatar mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .bolha {
      max-width: 80%; padding: 0.5rem 0.7rem;
      border-radius: var(--r-md); border-bottom-left-radius: 4px;
      background: var(--c-surface-2); border: 1px solid var(--c-border);
      color: var(--c-text); font-size: 0.83rem; line-height: 1.45;
      white-space: pre-wrap; word-wrap: break-word;
    }
    .bolha-user {
      background: var(--c-primary); border-color: var(--c-primary); color: #fff;
      border-radius: var(--r-md); border-bottom-right-radius: 4px;
    }

    /* Digitando */
    .digitando { display: flex; gap: 4px; align-items: center; }
    .digitando span {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--c-text-soft); animation: pulso 1.2s infinite ease-in-out;
    }
    .digitando span:nth-child(2) { animation-delay: 0.18s; }
    .digitando span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes pulso {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-3px); }
    }

    /* Erro */
    .erro {
      display: flex; align-items: center; gap: 0.5rem;
      margin: 0 0.875rem; padding: 0.5rem 0.7rem;
      background: var(--c-danger-soft); color: var(--c-danger);
      border-radius: var(--r-sm); font-size: 0.78rem;
    }
    .erro mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Composer */
    .composer {
      display: flex; align-items: flex-end; gap: 0.45rem;
      padding: 0.625rem 0.75rem; border-top: 1px solid var(--c-border);
    }
    .composer textarea {
      flex: 1; resize: none; max-height: 110px;
      font-family: inherit; font-size: 0.85rem; line-height: 1.45;
      color: var(--c-text); background: var(--c-surface-2);
      border: 1px solid var(--c-border); border-radius: var(--r-md);
      padding: 0.5rem 0.65rem; outline: none;
      transition: border-color 0.13s ease, box-shadow 0.13s ease;
    }
    .composer textarea:focus { border-color: var(--c-primary); box-shadow: var(--ring); }
    .enviar-btn {
      width: 38px; height: 38px; flex-shrink: 0; border: none;
      border-radius: var(--r-md); background: var(--c-primary); color: #fff;
      cursor: pointer; display: grid; place-items: center;
      transition: background 0.13s ease, opacity 0.13s ease;
    }
    .enviar-btn:hover:not(:disabled) { background: var(--c-primary-hover); }
    .enviar-btn:disabled { opacity: 0.5; cursor: default; }
    .enviar-btn mat-icon { font-size: 19px; width: 19px; height: 19px; }

    /* Mobile: painel quase cheio */
    @media (max-width: 480px) {
      .widget { right: 1rem; bottom: 1rem; left: 1rem; align-items: stretch; }
      .painel { width: auto; height: calc(100vh - 6rem); }
      .fab { align-self: flex-end; }
    }
  `,
})
export class ChatWidgetComponent {
  private ia = inject(IaService);

  readonly aberto = signal(false);
  readonly mensagens = signal<ChatMessage[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly input = new FormControl('', { nonNullable: true });

  private readonly scrollArea = viewChild<ElementRef<HTMLElement>>('scrollArea');

  readonly sugestoes = [
    'Quais produtos preciso repor?',
    'Qual produto vai acabar primeiro?',
    'Como registro uma movimentação?',
  ];

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.shiftKey) return; // Shift+Enter = quebra de linha
    event.preventDefault();
    this.enviar();
  }

  enviarTexto(texto: string): void {
    this.input.setValue(texto);
    this.enviar();
  }

  enviar(): void {
    const texto = this.input.value.trim();
    if (!texto || this.carregando()) return;

    this.erro.set(null);
    this.mensagens.update((m) => [...m, { papel: 'user', conteudo: texto }]);
    this.input.setValue('');
    this.carregando.set(true);
    this.scrollToBottom();

    this.ia.chat(this.mensagens()).subscribe({
      next: (res) => {
        this.mensagens.update((m) => [...m, { papel: 'assistant', conteudo: res.resposta }]);
        this.carregando.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.message ?? 'Não consegui falar com a IA. Tente de novo.');
      },
    });
  }

  limpar(): void {
    this.mensagens.set([]);
    this.erro.set(null);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.scrollArea()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
