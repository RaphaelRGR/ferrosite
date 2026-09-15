# PORTAL-001 — Shell do Portal (+ harness de RLS)

Data: 2026-09-15 · Fase F3 (início) · Depende de AUTH-001/002

## Entregue

- **Shell** ([src/app/(portal)/layout.tsx](../../src/app/(portal)/layout.tsx)): sidebar no desktop (logo, navegação, rodapé institucional), header com tema/perfil/"Voltar ao site"/"Sair", drawer no mobile (`Drawer` primitivo sobre `<dialog>`: inert, Escape, retorno de foco, wrap de Tab), um único `<main id="conteudo">`, skip link. Referências visuais: `referencias_ferro/portal/*` (estrutura e hierarquia; nenhum número, pessoa ou projeto dos mockups foi copiado).
- **Tema persistente** (06A): cookie `portal-theme` aplicado no `<html>` no servidor (sem flash); "Sistema" resolvido por script inline antes da pintura; `ThemeToggle` (rádios acessíveis) aplica sem reload e persiste via Server Action (cookie + `user_preference` quando há banco). O site público não herda.
- **Navegação por permissão** (`src/lib/portal/navigation.ts`): só rotas existentes com função — Início, Projetos, Configurações; `requires` filtra por papel global (Pessoas/Relatórios entram com suas fatias). Busca e notificações **omitidas** (não há dado nem feature) em vez de controles falsos.
- **Páginas**: Início com estado vazio honesto (sem KPIs fictícios); Projetos lista o que a RLS permitir (vazio real até PORTAL-002); Configurações (tema + dados da conta); 404 do Portal via catch-all dentro do shell (resolve o achado de I18N-001). `/portal/questoes` e `/portal/acervo` continuam acessíveis por URL, fora da navegação (decisão pendente em 33).
- **Harness de RLS local** (`tests/rls/`): Postgres 17 embutido (`embedded-postgres`, MIT, dev-only) + shim mínimo do schema `auth` (users, `uid()`, `role()`, `jwt()`, papéis anon/authenticated/service_role com grants padrão). Aplica as migrations reais e roda **13 cenários** de isolamento: perfil pendente por trigger, leitura de perfis por vínculo, auto-promoção negada, último admin protegido, anônimo negado, cross-project negado, criação de projeto por papel, gestão de membership por líder, pendente/desativado sem acesso, externo com prazo obrigatório/expirado/vigente, projeto sem DELETE e arquivamento consistente, missões (autor/líder/responsável), auditoria append-only só para overseers.
- **Usuário de teste** no Auth do projeto (`scripts/create-test-user.mjs`, service role) e credenciais em `.env.local`; Playwright carrega `.env.local`.

## Validação

- `npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **89/89** (+5 shell) · `npm run test:rls` **13/13** · build 27 rotas.
- `npm run test:e2e` **98/98** — inclui o fluxo autenticado real contra o Supabase: login por senha, sessão, `/login` com sessão ⇒ 307, logout revoga; **tema persiste** entre rotas e recarregamentos (SSR já escuro); como o schema ainda não está aplicado na nuvem, o usuário cai no bloqueio "Acesso pendente" e o teste valida isso (anotado no relatório do Playwright).

## Achados

1. `signOut()` do Supabase revoga a sessão **globalmente** (todos os dispositivos) — correto para 21, mas testes com a mesma conta precisam ser seriais.
2. Redirect de Server Action muda a URL antes de o DOM da rota chegar: testes devem esperar o conteúdo, não só `waitForURL`.
3. `initdb` no Windows cria cluster WIN1252; o harness força `--encoding=UTF8 --locale=C`.

## Pendências

- Aplicar migrations na nuvem (`SUPABASE_DB_PASSWORD`), gerar tipos, promover `e2e-admin@ferrosite.test` a admin ativo e rodar o e2e do shell completo (sidebar/drawer) — hoje só o bloqueio é exercitado com sessão real.
- Locale do Portal (PT/EN) e `lang` dinâmico — decisão 33.
- Sidebar recolhível/rail em tablet (08) — quando houver mais itens.
