# estoqueIA Angular — Contexto do projeto

> Documentação viva do **frontend**. Atualizar a cada mudança significativa (nova página, dependência, decisão de UX, alteração de design system).
>
> **Última atualização:** 2026-06-03
>
> Backend correspondente: [EstoqueIA-spring](../estoqueIA/context.md)

---

## Visão geral

SPA Angular que consome a API REST do `estoqueIA` (Spring Boot 4).

- **Framework:** Angular 20.3 (standalone components, Material 3)
- **UI:** Angular Material com design system custom estilo SaaS (Linear/Vercel), tema claro
- **Estado:** Signals (sem NgRx)
- **Forms:** Reactive Forms
- **HTTP:** `provideHttpClient` + interceptor de auth (Bearer + refresh automático)
- **Routing:** Lazy loading com guards (auth/admin/guest)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Angular 20.3 |
| Linguagem | TypeScript (strict) |
| UI | Angular Material 20.2 (tema custom) |
| Tipografia | Inter (Google Fonts) |
| Ícones | Material Symbols Rounded (Google Fonts) |
| Estado | Signals (`@angular/core`) |
| HTTP | `HttpClient` + `withInterceptors` |
| Forms | Reactive Forms |
| Roteamento | `provideRouter` com `withComponentInputBinding` |
| Build | Angular CLI 20.3 (esbuild) |
| Package manager | npm 11.6 |
| Runtime dev | Node.js 24.12 |

## Como rodar

### Pré-requisitos
- Node.js 18+ (testado em 24.12)
- Backend rodando em `http://localhost:8080` (CORS já liberado lá)

### Comandos
```bash
npm install                # primeira vez
npm start                  # = ng serve --port 4200
npm run build              # build de produção
npm test                   # testes (karma + jasmine — não escritos ainda)
```

Acesse **http://localhost:4200**.

## Configuração

### Environment
- `src/environments/environment.ts` (dev): `apiUrl: 'http://localhost:8080'`
- `src/environments/environment.prod.ts` (prod): `apiUrl: '/api'` — assume reverse proxy no mesmo host

### Tema
Configurado em `src/styles.scss` — estética **SaaS moderna light** (inspiração Linear/Vercel):
- Neutros frios (zinc), bordas finas de 1px, sombras quase imperceptíveis (a separação vem das bordas)
- Acento **índigo-violeta** refinado (`#5b5bd6`) — substituiu o violet/pink antigo
- Raios menores (`--r-md: 8px`, `--r-lg: 12px`), botões/cards menos arredondados
- Números com `font-variant-numeric: tabular-nums` (KPIs e tabelas)
- Density **-1**, tipografia **Inter** (headings com tracking negativo)
- Material M3 recolorizado via override de `--mat-sys-primary*` para casar com o acento
- Design system custom em CSS vars (`--c-primary`, `--c-surface-2`, `--grad-primary`, `--s-N`, etc.)

## Estrutura de pastas

```
src/
├── environments/
│   ├── environment.ts          # dev
│   └── environment.prod.ts     # prod
├── app/
│   ├── core/auth/
│   │   ├── auth.service.ts      # signals: me(), role(), isAdmin(), isAuthenticated()
│   │   ├── auth.interceptor.ts  # Bearer + refresh em 401
│   │   └── auth.guards.ts       # authGuard, adminGuard, guestGuard
│   ├── models/                  # tipos espelhando DTOs do backend
│   │   ├── auth.model.ts
│   │   ├── usuario.model.ts
│   │   ├── categoria.model.ts
│   │   ├── produto.model.ts
│   │   ├── movimentacao.model.ts
│   │   ├── previsao.model.ts
│   │   ├── ia.model.ts          # ChatMessage, ChatResponse (chat IA)
│   │   └── page.model.ts        # Page<T>, ApiError
│   ├── services/                # 1 service por domínio (chamadas HTTP)
│   │   ├── usuario.service.ts
│   │   ├── categoria.service.ts
│   │   ├── produto.service.ts
│   │   ├── movimentacao.service.ts
│   │   ├── previsao.service.ts
│   │   └── ia.service.ts          # POST /ia/chat
│   ├── layouts/main-layout/     # shell só com sidebar (sem topbar); usuário no rodapé
│   ├── pages/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/           # KPIs com gradiente + previsão IA
│   │   ├── categorias/          # list + form (criar/editar)
│   │   ├── produtos/            # list + form
│   │   ├── movimentacoes/       # formulário lado a lado com histórico
│   │   ├── usuarios/            # admin only
│   │   └── perfil/              # /me, edição própria
│   ├── shared/
│   │   ├── page-header/         # header padrão de página com ícone
│   │   ├── empty-state/         # estado vazio com CTA via ng-content
│   │   ├── chat-widget/         # chat de IA flutuante (FAB no canto, em todas as telas)
│   │   └── confirm-dialog/      # modal de confirmação reutilizável
│   ├── app.ts                   # root component
│   ├── app.config.ts            # providers: HttpClient + interceptor + animations + router
│   └── app.routes.ts            # lazy routes com guards
├── styles.scss                  # tema Material + design system custom
└── index.html
```

## Rotas

| Path | Guard | Componente | Descrição |
|---|---|---|---|
| `/login` | guest | `LoginPage` | Autenticação |
| `/register` | guest | `RegisterPage` | Criação de conta (role USUARIO) |
| `/dashboard` | auth | `DashboardPage` | KPIs + previsões IA |
| `/categorias` | auth | `CategoriasListPage` | Lista paginada |
| `/categorias/nova` | admin | `CategoriaFormPage` | Criar |
| `/categorias/:id` | admin | `CategoriaFormPage` | Editar |
| `/produtos` | auth | `ProdutosListPage` | Lista com busca por nome |
| `/produtos/novo` | admin | `ProdutoFormPage` | Criar |
| `/produtos/:id` | admin | `ProdutoFormPage` | Editar |
| `/movimentacoes` | auth | `MovimentacoesPage` | Formulário + histórico |
| `/usuarios` | admin | `UsuariosListPage` | Listagem ADMIN |
| `/perfil` | auth | `PerfilPage` | `/usuarios/me` + troca de senha |

Todas usam **lazy loading** via `loadComponent`.

## Autenticação

### Fluxo
1. `POST /auth/login` retorna `{accessToken, refreshToken, tokenType, expiresIn}`
2. Tokens são salvos em `localStorage` (keys `estoqueia.accessToken` / `estoqueia.refreshToken`)
3. `AuthService` mantém signals reativas (`isAuthenticated`, `role`, `isAdmin`, `me`)
4. `authInterceptor` injeta `Authorization: Bearer <token>` em toda requisição pra `apiUrl`, exceto rotas públicas (`/auth/login`, `/auth/register`, `/auth/refresh`)
5. Em **401**, o interceptor chama `POST /auth/refresh` e refaz a requisição original com o novo access token
6. Se o refresh falhar, faz logout e redireciona pra `/login`

### Role decoding
O JWT é decodificado client-side só pra ler a claim `scope` (`ADMIN`/`USUARIO`). Não é usado pra validação (isso é do backend).

### Guards
- **`authGuard`** — só passa se `isAuthenticated()`, senão redireciona pra `/login`
- **`adminGuard`** — só passa se `isAdmin()`, senão redireciona pra `/dashboard`
- **`guestGuard`** — só passa se **não** autenticado (pra `/login` e `/register`)

## Design system

### Cores semânticas (CSS vars)
| Var | Uso |
|---|---|
| `--c-primary` (#5b5bd6) | índigo-violeta, ações principais (`--c-primary-hover`, `--c-primary-strong` p/ texto) |
| `--c-success` (#0e9f6e) | confirmações, ENTRADA, status Ativo |
| `--c-warning` (#d97706) | atenção, baixo estoque |
| `--c-danger` (#e5484d) | erros, SAÍDA, deletar |
| `--c-info` (#0ea5e9) | informativo |
| `--c-text`, `--c-text-muted`, `--c-text-soft` | hierarquia tipográfica (zinc) |
| `--c-bg`, `--c-surface`, `--c-surface-2`, `--c-border`, `--c-border-strong` | layout |

Cada cor tem variante `*-soft` pra backgrounds de pills/badges. Helpers globais de chip: `.chip-ok`, `.chip-muted`, `.chip-accent`, `.chip-danger`.

### Gradientes (uso pontual)
- `--grad-primary` — índigo (usado só no logo, avatar e painel de auth)
- `--grad-success`, `--grad-warning`, `--grad-danger`, `--grad-info` (definidos, pouco usados)
- **KPIs não usam mais gradiente cheio** — agora são cards brancos com chip de ícone colorido + número grande.

### Spacing scale
`--s-1` (4px), `--s-2` (8px), ..., `--s-7` (48px). Raios: `--r-sm` 6px, `--r-md` 8px, `--r-lg` 12px, `--r-xl` 16px.

### Componentes Material customizados (em `styles.scss`)
- Cards `border-radius: 12px`, sombra mínima (`--shadow-sm`), borda 1px
- Tabelas com header em `--c-surface-2`, uppercase + tracking, rows com borda inferior 1px e hover sutil
- Botões `border-radius: 8px`, font-weight 550, sem uppercase
- Chips `border-radius: 6px` (não mais pill), font-weight 600, altura 22px
- Foco de teclado com `--ring` (anel índigo) em links e botões

## Padrões adotados

- **Standalone components** em tudo (sem `NgModule`)
- **`inject()`** em vez de constructor injection
- **`ChangeDetectionStrategy.OnPush`** em todos os componentes
- **Signals** (`signal`, `computed`) para state, **não** `BehaviorSubject`
- **Reactive Forms** (`FormBuilder.nonNullable.group`)
- **Lazy loading** de todas as rotas
- **DTOs separados** (`Request` vs `Response` espelhando backend)
- **`@if`, `@for`, `@switch`** (control flow novo, sem `*ngIf` / `*ngFor`)
- **`input.required()`** e **`input()`** em vez de `@Input()` decorator
- **`withComponentInputBinding()`** no router → params de rota viram inputs

## Componentes compartilhados

### `<app-page-header>`
```html
<app-page-header
  title="Produtos"
  subtitle="Gerencie seu catálogo"
  icon="inventory_2"
>
  <button mat-flat-button color="primary">Novo</button>
</app-page-header>
```
Header padronizado: ícone em pill lavanda + título + subtítulo. Slot pra ações via `ng-content`.

### `<app-empty-state>`
```html
<app-empty-state
  icon="inventory_2"
  title="Nenhum produto"
  description="Cadastre o primeiro pra começar."
>
  <button mat-flat-button>Criar</button>
</app-empty-state>
```
Estado vazio amigável com ícone, título, descrição e CTA opcional.

### `<app-chat-widget>`
Chat de IA **flutuante** (FAB redondo no canto inferior direito) embutido no `MainLayoutComponent`,
então aparece em todas as telas autenticadas. Abre um painel com histórico de conversa, chips de
sugestão, indicador de digitação e atalho Enter/Shift+Enter. Estado em signals; histórico só na
sessão (não persiste). Consome `IaService` → `POST /ia/chat`. Não é uma rota.

### `ConfirmDialogComponent`
Modal reutilizável aberto via `MatDialog`:
```ts
this.dialog.open(ConfirmDialogComponent, {
  data: { title, message, destructive: true }
}).afterClosed().subscribe(ok => ...);
```

## Integração com backend

| Resource | Endpoints consumidos |
|---|---|
| `AuthService` | `POST /auth/login`, `/register`, `/refresh`; `GET /usuarios/me` |
| `UsuarioService` | `GET /usuarios`, `/:id`; `PUT /:id`; `DELETE /:id` |
| `CategoriaService` | CRUD em `/categorias` |
| `ProdutoService` | CRUD em `/produtos` + `/baixo-estoque` |
| `MovimentacaoService` | `GET /movimentacoes?produtoId=`, `POST /movimentacoes` |
| `PrevisaoService` | `GET /previsao/produtos/:id`, `/reposicao-sugerida` |
| `IaService` | `POST /ia/chat` (histórico na sessão; backend stateless) |

Erros do backend chegam no formato `ApiError` (`{timestamp, status, error, message, fieldErrors?}`). Componentes exibem `err.error?.message` via `MatSnackBar` em geral.

## Decisões de UX

- **Sem topbar**: navegação e conta ficam todas na **sidebar esquerda**. Os itens são agrupados em seções (**Geral / Estoque / Administração**); seção sem itens visíveis (ex.: Administração p/ não-admin) some inteira. O card de usuário (avatar + nome + role com bolinha de status) fica no rodapé e abre o menu (Meu perfil / Sair). Item ativo tem barrinha de acento à esquerda + **ícone preenchido** (eixo `FILL` do Material Symbols).
- **Sidebar fixa em desktop** (`mode=side`); no mobile (<768px) vira `mode=over` com um **botão de menu flutuante** no canto superior esquerdo
- **Itens admin-only** ficam ocultos da navegação pra `USUARIO` (não só desabilitados)
- **Confirmação destrutiva**: dialog antes de deletar/desativar
- **Loading states**: spinner Material centralizado durante fetch inicial; em ações, botão muda label pra "Salvando..."
- **Erros**: pill vermelha inline em formulários; snackbar para ações
- **Soft-delete visual**: produtos/usuários inativos aparecem com chip cinza mas continuam na listagem
- **Movimentação**: tela split (form + histórico) pra fluxo rápido sem trocar de rota
- **Login/Register**: layout split-screen — painel de marca com gradiente índigo + features à esquerda, formulário à direita (colapsa só pro form em <880px)
- **Assistente IA**: chat **flutuante** no canto (FAB), não uma página — fica sempre acessível sobre qualquer tela. No mobile o painel ocupa quase a largura toda.

## Tarefas futuras

- [ ] Trocar tabelas Material por **CDK Tables** com sort/multi-column filter
- [x] **Gráficos** no dashboard — donut "Saúde do estoque" + barras "Produtos por categoria" em **SVG/CSS puro** (sem lib). Falta: séries temporais de movimentações (aí talvez valha Chart.js/ngx-charts)
- [ ] **Detalhe do produto** com gráfico de previsão (linha histórica + projeção)
- [ ] **Tema dark** (já tem `color-scheme: light` declarado; trocar pra `light dark`)
- [ ] **PWA** (`ng add @angular/pwa`)
- [ ] **i18n** com `@angular/localize` (hoje tudo em PT-BR hardcoded)
- [ ] **Testes** com `provideHttpClientTesting` (zero testes hoje)
- [ ] **Refinar formulário de produto**: máscara R$ no preço, autocomplete na categoria
- [ ] **Skeleton loaders** em vez de spinner pra UX mais polida
- [ ] **Toasts** com posicionamento padronizado (top-right) e variantes

## Notas operacionais

### Porta ocupada
Se `ng serve` reclamar de porta em uso:
```powershell
Get-NetTCPConnection -LocalPort 4200 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Sem token / token expirado
O interceptor refresca automaticamente. Se o refresh expirar (30 dias), volta pra `/login`. Localmente, limpar via DevTools → Application → LocalStorage → `estoqueia.*`.

### Limpar build cache
```bash
rm -rf .angular dist
```

### Lint / Format
Prettier está configurado no `package.json` (printWidth 100, singleQuote). VSCode usa automaticamente.
