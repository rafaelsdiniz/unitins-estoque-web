import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
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
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="container" autosize>
      <mat-sidenav
        #sidenav
        [opened]="opened()"
        (openedChange)="opened.set($event)"
        mode="side"
        class="sidenav"
      >
        <div class="brand">
          <img src="unitins_estoque.png" alt="Unitins Estoque" class="brand-logo" />
        </div>

        <nav class="nav">
          <div class="nav-section">Principal</div>
          @for (item of visibleNav(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              (click)="onMobileClose()"
              class="nav-item"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
              @if (item.adminOnly) {
                <span class="badge">ADMIN</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="version">v0.0.1 — beta</div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <header class="topbar">
          <button mat-icon-button (click)="opened.set(!opened())" aria-label="Menu" class="icon-btn">
            <mat-icon>menu</mat-icon>
          </button>

          <div class="spacer"></div>

          <button mat-icon-button matTooltip="Notificações" aria-label="Notificações" class="icon-btn">
            <mat-icon>notifications</mat-icon>
          </button>

          <span class="topbar-divider"></span>

          <button [matMenuTriggerFor]="userMenu" class="user-btn" aria-label="Conta">
            <div class="avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ auth.me()?.nome ?? 'Usuário' }}</div>
              <div class="user-role">{{ roleLabel() }}</div>
            </div>
            <mat-icon class="user-caret">expand_more</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu" xPosition="before">
            <button mat-menu-item routerLink="/perfil">
              <mat-icon>person</mat-icon>
              <span>Meu perfil</span>
            </button>
            <mat-divider />
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .container {
      height: 100vh;
      background: var(--c-bg);
    }

    .sidenav {
      width: 244px;
      background: var(--c-surface);
      border-right: 1px solid var(--c-border);
      display: flex;
      flex-direction: column;
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid var(--c-border);
    }

    .brand-logo {
      display: block;
      width: 100%;
      max-width: 150px;
      height: auto;
    }

    .nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
    }

    .nav-section {
      font-size: 0.66rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--c-text-soft);
      padding: 0 0.625rem;
      margin-bottom: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.625rem;
      border-radius: var(--r-md);
      color: var(--c-text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 550;
      margin-bottom: 2px;
      transition: background 0.13s ease, color 0.13s ease;
      position: relative;
    }

    .nav-item mat-icon {
      color: var(--c-text-soft);
      font-size: 19px;
      width: 19px;
      height: 19px;
      transition: color 0.13s ease;
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
      font-weight: 600;
    }

    .nav-item.active mat-icon {
      color: var(--c-primary);
    }

    .nav-item .badge {
      margin-left: auto;
      font-size: 0.58rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      border-radius: var(--r-sm);
      background: var(--c-surface-2);
      color: var(--c-text-soft);
    }

    .sidebar-footer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--c-border);
    }

    .version {
      font-size: 0.68rem;
      color: var(--c-text-soft);
    }

    /* Topbar */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.5rem;
      height: 61px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: saturate(180%) blur(12px);
      border-bottom: 1px solid var(--c-border);
    }

    .spacer { flex: 1; }

    .icon-btn { color: var(--c-text-muted); }
    .icon-btn:hover { color: var(--c-text); }

    .topbar-divider {
      width: 1px;
      height: 26px;
      background: var(--c-border);
      margin: 0 0.5rem;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 4px 10px 4px 4px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.13s ease, border-color 0.13s ease;
    }

    .user-btn:hover {
      background: var(--c-surface-2);
      border-color: var(--c-border);
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--grad-primary);
      color: white;
      display: grid;
      place-items: center;
      font-weight: 650;
      font-size: 0.78rem;
      letter-spacing: 0;
      flex-shrink: 0;
    }

    .user-info {
      text-align: left;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--c-text);
      white-space: nowrap;
    }

    .user-role {
      font-size: 0.7rem;
      color: var(--c-text-muted);
      font-weight: 500;
    }

    .user-caret {
      color: var(--c-text-soft);
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .content {
      padding: 1.75rem 2rem;
      min-height: calc(100vh - 61px);
    }

    @media (max-width: 768px) {
      .user-info { display: none; }
      .content { padding: 1rem; }
    }
  `,
})
export class MainLayoutComponent {
  protected auth = inject(AuthService);
  readonly opened = signal(true);

  private readonly nav: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/produtos', label: 'Produtos', icon: 'inventory_2' },
    { path: '/categorias', label: 'Categorias', icon: 'category' },
    { path: '/movimentacoes', label: 'Movimentações', icon: 'swap_horiz' },
    { path: '/usuarios', label: 'Usuários', icon: 'group', adminOnly: true },
  ];

  readonly visibleNav = computed(() =>
    this.nav.filter((i) => !i.adminOnly || this.auth.isAdmin()),
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

  logout(): void {
    this.auth.logout();
  }

  onMobileClose(): void {
    if (window.innerWidth < 768) {
      this.opened.set(false);
    }
  }
}
