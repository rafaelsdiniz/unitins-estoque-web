import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ChatWidgetComponent } from '../../shared/chat-widget/chat-widget.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ChatWidgetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="container" autosize>
      <mat-sidenav
        #sidenav
        [opened]="opened()"
        (openedChange)="opened.set($event)"
        [mode]="isMobile() ? 'over' : 'side'"
        class="sidenav"
      >
        <div class="brand">
          <img src="unitins_estoque.png" alt="Unitins Estoque" class="brand-logo" />
        </div>

        <nav class="nav">
          @for (section of visibleSections(); track section.title) {
            <div class="nav-section">
              <div class="nav-section-title">{{ section.title }}</div>
              @for (item of section.items; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  (click)="onMobileClose()"
                  class="nav-item"
                >
                  <span class="nav-bar"></span>
                  <mat-icon>{{ item.icon }}</mat-icon>
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.adminOnly) {
                    <span class="badge">ADMIN</span>
                  }
                </a>
              }
            </div>
          }
        </nav>

        <div class="sidebar-footer">
          <button [matMenuTriggerFor]="userMenu" class="user-card" aria-label="Conta">
            <div class="avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ auth.me()?.nome ?? 'Usuário' }}</div>
              <div class="user-role">
                <span class="dot" [class.dot-admin]="auth.isAdmin()"></span>
                {{ roleLabel() }}
              </div>
            </div>
            <mat-icon class="user-caret">unfold_more</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu" xPosition="before">
            <button mat-menu-item routerLink="/perfil">
              <mat-icon>person</mat-icon>
              <span>Meu perfil</span>
            </button>
            <mat-divider />
            <button mat-menu-item class="danger" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    @if (isMobile()) {
      <button class="mobile-menu" (click)="opened.set(!opened())" aria-label="Menu">
        <mat-icon>{{ opened() ? 'close' : 'menu' }}</mat-icon>
      </button>
    }

    <app-chat-widget />
  `,
  styles: `
    .container {
      height: 100vh;
      background: var(--c-bg);
    }

    .sidenav {
      width: 256px;
      background: var(--c-surface);
      border-right: 1px solid var(--c-border);
      display: flex;
      flex-direction: column;
    }

    /* O Material projeta o conteúdo num container interno que não herda o flex
       do host; forçamos altura cheia + coluna pra fixar o perfil no rodapé. */
    .sidenav ::ng-deep .mat-drawer-inner-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Marca */
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.375rem 1.25rem;
      border-bottom: 1px solid var(--c-border);
    }
    .brand-logo {
      display: block;
      width: 100%;
      max-width: 152px;
      height: auto;
    }

    /* Navegação */
    .nav {
      flex: 1;
      padding: 1rem 0.75rem 0.5rem;
      overflow-y: auto;
    }
    .nav-section + .nav-section {
      margin-top: 1.125rem;
    }
    .nav-section-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--c-text-soft);
      padding: 0 0.7rem;
      margin-bottom: 0.4rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.575rem 0.7rem;
      border-radius: var(--r-md);
      color: var(--c-text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 550;
      margin-bottom: 2px;
      position: relative;
      transition: background 0.14s ease, color 0.14s ease;
    }
    .nav-item mat-icon {
      color: var(--c-text-soft);
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: color 0.14s ease;
    }
    .nav-label {
      flex: 1;
      white-space: nowrap;
    }

    /* Barrinha de acento à esquerda */
    .nav-bar {
      position: absolute;
      left: -0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      border-radius: 0 3px 3px 0;
      background: var(--c-primary);
      transition: height 0.16s ease;
    }

    .nav-item:hover {
      background: var(--c-surface-2);
      color: var(--c-text);
    }
    .nav-item:hover mat-icon {
      color: var(--c-text-muted);
    }

    .nav-item.active {
      background: var(--c-primary-soft);
      color: var(--c-primary-strong);
      font-weight: 650;
    }
    .nav-item.active mat-icon {
      color: var(--c-primary);
      /* ícone preenchido quando ativo (eixo FILL do Material Symbols) */
      font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    }
    .nav-item.active .nav-bar {
      height: 20px;
    }

    .badge {
      font-size: 0.56rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      border-radius: var(--r-sm);
      background: var(--c-surface-2);
      color: var(--c-text-soft);
    }
    .nav-item.active .badge {
      background: #fff;
      color: var(--c-primary-strong);
    }

    /* Rodapé com usuário */
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--c-border);
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--c-border);
      border-radius: var(--r-lg);
      background: var(--c-surface);
      cursor: pointer;
      font-family: inherit;
      transition: background 0.13s ease, border-color 0.13s ease, box-shadow 0.13s ease;
    }
    .user-card:hover {
      background: var(--c-surface-2);
      border-color: var(--c-border-strong);
      box-shadow: var(--shadow-sm);
    }

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--grad-primary);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 650;
      font-size: 0.84rem;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      text-align: left;
      line-height: 1.3;
      min-width: 0;
    }
    .user-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--c-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      color: var(--c-text-muted);
      font-weight: 500;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--c-text-soft);
      flex-shrink: 0;
    }
    .dot-admin {
      background: var(--c-success);
    }
    .user-caret {
      color: var(--c-text-soft);
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      flex-shrink: 0;
    }

    /* Conteúdo */
    .content {
      padding: 1.75rem 2rem;
      min-height: 100vh;
    }

    /* Botão de menu flutuante (mobile) */
    .mobile-menu {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 900;
      width: 44px;
      height: 44px;
      border-radius: var(--r-md);
      border: 1px solid var(--c-border);
      background: var(--c-surface);
      color: var(--c-text);
      cursor: pointer;
      display: grid;
      place-items: center;
      box-shadow: var(--shadow-sm);
    }

    @media (max-width: 768px) {
      .content {
        padding: 4rem 1rem 1rem;
      }
    }
  `,
})
export class MainLayoutComponent {
  protected auth = inject(AuthService);

  readonly isMobile = signal(window.innerWidth < 768);
  readonly opened = signal(window.innerWidth >= 768);

  private readonly sections: NavSection[] = [
    {
      title: 'Geral',
      items: [{ path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' }],
    },
    {
      title: 'Estoque',
      items: [
        { path: '/produtos', label: 'Produtos', icon: 'inventory_2' },
        { path: '/categorias', label: 'Categorias', icon: 'category' },
        { path: '/movimentacoes', label: 'Movimentações', icon: 'swap_horiz' },
      ],
    },
    {
      title: 'Administração',
      items: [{ path: '/usuarios', label: 'Usuários', icon: 'group', adminOnly: true }],
    },
  ];

  readonly visibleSections = computed<NavSection[]>(() =>
    this.sections
      .map((s) => ({ ...s, items: s.items.filter((i) => !i.adminOnly || this.auth.isAdmin()) }))
      .filter((s) => s.items.length > 0),
  );

  readonly initials = computed(() => {
    const nome = this.auth.me()?.nome ?? '';
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly roleLabel = computed(() => (this.auth.role() === 'ADMIN' ? 'Administrador' : 'Usuário'));

  constructor() {
    if (!this.auth.me()) {
      this.auth.loadMe().subscribe();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    const mobile = window.innerWidth < 768;
    if (mobile !== this.isMobile()) {
      this.isMobile.set(mobile);
      this.opened.set(!mobile);
    }
  }

  logout(): void {
    this.auth.logout();
  }

  onMobileClose(): void {
    if (this.isMobile()) {
      this.opened.set(false);
    }
  }
}
