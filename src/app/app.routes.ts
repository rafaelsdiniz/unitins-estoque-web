import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./pages/categorias/categorias-list.page').then((m) => m.CategoriasListPage),
      },
      {
        path: 'categorias/nova',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/categorias/categoria-form.page').then((m) => m.CategoriaFormPage),
      },
      {
        path: 'categorias/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/categorias/categoria-form.page').then((m) => m.CategoriaFormPage),
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./pages/produtos/produtos-list.page').then((m) => m.ProdutosListPage),
      },
      {
        path: 'produtos/novo',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/produtos/produto-form.page').then((m) => m.ProdutoFormPage),
      },
      {
        path: 'produtos/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/produtos/produto-form.page').then((m) => m.ProdutoFormPage),
      },
      {
        path: 'movimentacoes',
        loadComponent: () =>
          import('./pages/movimentacoes/movimentacoes.page').then((m) => m.MovimentacoesPage),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/usuarios/usuarios-list.page').then((m) => m.UsuariosListPage),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
