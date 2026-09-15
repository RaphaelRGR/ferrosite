# AUTH-001 + AUTH-002 — Schema/RLS e login/sessão/guard

Data: 2026-09-14 · Fase F2 (segurança vertical) · Depende de ARCH-001, DS-001, I18N-001

## Estado

| Item | Estado |
|---|---|
| Projeto Supabase | `dsookutmubatecxzxtix` (fornecido pelo usuário; chaves em `.env.local`, gitignored; rotação prevista antes do ar) |
| `supabase init` + `supabase/migrations/20260914000100_identity_and_core.sql` | escrito |
| **Migrations aplicadas** | **pendente** — o projeto está em outra conta (CLI não faz `link`); exige `SUPABASE_DB_PASSWORD` em `.env.local` para `supabase db push` |
| Tipos gerados (`src/types/database.ts`) | pendente (depende do push) |
| Guard fail-closed no proxy, login, callback, logout, gate por perfil ativo | implementado e testado (unit + e2e anônimo) |
| Testes de isolamento RLS (`tests/integration/rls.test.ts`) | escritos; falham até o schema ser aplicado |
| E2E autenticado (`auth.spec.ts` › autenticado) | escrito; pulado até existir usuário de teste (`E2E_ADMIN_EMAIL/PASSWORD`) |

## AUTH-001 — modelo mínimo (docs 11/20/21)

Tabelas: `profile` (1:1 com `auth.users`; nasce `pending`/`viewer` por trigger — domínio UFSC não concede acesso automático), `user_preference` (tema/locale para PORTAL-001), `project` (slug único, status, classificação, `archived_at` consistente, versão otimista), `project_membership` (papel por projeto; **externo exige `expires_at`** por constraint), `mission`, `mission_assignee`, `audit_event` (append-only, identidade própria, sem UPDATE/DELETE para usuários).

Funções `security definer` estáveis para as políticas: `is_active_user`, `has_global_role(...)`, `project_role_of`, `is_project_member/leader`, `is_project_overseer` (admin + coordenação), `shares_project_with`, `log_audit`.

RLS habilitada em todas as tabelas; `anon` sem grants (o site público lê projeções aprovadas, nunca tabelas). Resumo das políticas:

| Tabela | select | insert | update | delete |
|---|---|---|---|---|
| profile | próprio, overseers, colegas de projeto | trigger | próprio (papel/status só por admin, via trigger) / admin | — |
| project | overseers + membros vigentes | admin/coordenação/orientador | overseers + líder | — (arquivar) |
| project_membership | overseers + membros | overseers + líder | idem | idem |
| mission | overseers + membros | overseers, líder, membro | overseers, líder, autor, responsável | — |
| audit_event | overseers | só `log_audit` | — | — |

Triggers: `updated_at`/`version`; perfil ao criar usuário; guard que impede alterar papel/status sem ser admin e **rebaixar o último admin ativo**; auditoria automática de membership e de mudança de privilégios.

## AUTH-002 — sessão

- `src/proxy.ts`: `/portal/**` sem configuração ⇒ **503** (fail-closed); sem sessão ⇒ **307 `/login?next=`** com `next` allowlisted (`src/lib/auth/redirects.ts`: só `/portal...`, sem `//`, `\`, controle ou `..`); `/login` com sessão ⇒ Portal.
- `/login` (`(auth)/login`): e-mail + senha (Server Action) e link mágico com `shouldCreateUser: false` (sem auto-cadastro; resposta idêntica exista ou não o e-mail). Erros textuais genéricos.
- `/api/auth/callback`: `exchangeCodeForSession`; sem/inválido código ⇒ volta ao login com erro, sem cookie de sessão.
- Layout do Portal: exige perfil **ativo**; `pending`/`disabled` veem só a tela de bloqueio com "Sair". Header mostra usuário e logout (Server Action).
- `updateSession` agora devolve o usuário; `createClient` lança sem configuração (defesa em profundidade).

## Validação

- `npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **84/84** (+6: allowlist de redirect; proxy 503/307/locale sem rede) · build 26 rotas (`/login` e Portal dinâmicos).
- `npm run test:e2e` **99 passados, 1 pulado** (autenticado): `/portal*` anônimo ⇒ 307 com `next`; `/login` acessível e neutraliza `next` externo; callback inválido não cria sessão; credenciais inválidas ⇒ erro genérico; axe no `/login`.
- `npm run test:integration`: 7 cenários (anônimo, cross-project, líder cria/forasteiro não, pendente sem acesso, externo sem prazo/expirado, auto-promoção e último admin, auditoria) — **aguardam o schema**.

## Decisões tomadas com a liberdade concedida

1. Login por **e-mail + senha e link mágico**, sem cadastro público (provisionamento por admin). Política de domínio UFSC/externos continua pendente institucionalmente, mas o modelo já suporta (`global_role: external` + `expires_at`).
2. Contas novas nascem **pendentes**; um admin ativa. O primeiro admin é promovido via service role/SQL (guard liberado sem `auth.uid()`).
3. Portal e login ficam em **pt-BR** até a decisão de locale do Portal; strings já estão no catálogo (`auth.*`).
4. 307 (não 308) nos redirects de auth e locale — dependem de estado.

## Próximos passos (assim que houver `SUPABASE_DB_PASSWORD`)

```bash
npm run db:push            # ou: supabase db push --db-url "postgresql://postgres.<ref>:<senha>@..."
supabase gen types typescript --db-url "..." > src/types/database.ts
npm run test:integration   # isolamento RLS
# criar o primeiro admin (auth.admin.createUser + update profile) e rodar o e2e autenticado
```
