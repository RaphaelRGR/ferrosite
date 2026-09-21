# Runbook de operação — FerroSite (OPS-001)

Escopo: site público (Next.js) + Portal (Supabase Auth/Postgres). Hospedagem e provedores de e-mail/arquivos ainda dependem de decisão institucional (33); onde a decisão falta, o passo está marcado `[CONTEÚDO PENDENTE]`.

## 1. Ambientes e configuração

| Variável | Onde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build + runtime | Auth e leitura da projeção pública. Ausentes ⇒ Portal responde 503 (fail-closed) e o site segue sem publicações. |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime (servidor) | Só para `submit_research_challenge` e `preview_content`. Nunca no cliente; **rotacionar** ao ir ao ar (as chaves de 2026-09-15 foram usadas para configurar). |
| `CHALLENGE_HASH_SECRET` | runtime (servidor) | HMAC da origem do formulário de desafio (fallback: service role). |
| `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL` | só CI/máquina de migração | `npm run db:push` / `db:types`. Nunca em runtime. Host: session pooler IPv4 (`aws-<n>-<região>.pooler.supabase.com:5432`, usuário `postgres.<ref>`); o host direto `db.<ref>.supabase.co` só resolve em IPv6. |
| `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO` | runtime (servidor) | E-mail transacional (MAIL-001). Ausentes ⇒ a fila `mail_outbox` acumula em `queued` (nada se perde) e `/api/health` mostra `mailConfigured: false`. |
| `MAIL_DISPATCH_SECRET` | runtime (servidor) | Bearer do `POST /api/mail/dispatch` (cron de reprocessamento). Sem ele a rota responde 404. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID` | runtime (servidor) | Drive somente leitura (DRIVE-001): verificação, original/miniatura no Portal e capa pública por proxy. Ausentes ⇒ só metadados; `/api/health` mostra `driveConfigured: false`. A pasta institucional deve estar compartilhada com a conta de serviço como Leitor. |
| `NEXT_PUBLIC_SITE_URL` | build | canonical/hreflang/sitemap. |
| `NEXT_PUBLIC_CONTENT_MODE` | build | `review` (selo em conteúdo não verificado) ou `strict` (oculta). Produção: definir explicitamente. |

Checagem rápida: `GET /api/health` → `{ status: "ok", supabaseConfigured: true, mailConfigured: true, driveConfigured: true }` (sem segredos, sem cache).

## 2. Deploy

1. `npm run check` (lint, typecheck, unit, RLS embutido, build, e2e) no CI.
2. Migrations: `npm run db:push` contra o projeto (transação por arquivo; ver `supabase/migrations/`). Depois `npm run db:types` (nuvem) ou `npm run db:types:local` (Postgres embutido, sem Docker) e commitar `src/types/database.ts` se mudou.
3. Build com `NODE_ENV=production` (HSTS e `upgrade-insecure-requests` só entram em produção).
4. Smoke pós-deploy: `/api/health`, `/pt`, `/login` (307 em `/portal` anônimo), `/robots.txt`.

## 3. Segurança em runtime

- Cabeçalhos: CSP (`default-src 'self'`; scripts `'self' 'unsafe-inline'` — Next injeta scripts inline em páginas estáticas; nonce exigiria renderização dinâmica de todo o site), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, HSTS (prod), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, sem `X-Powered-By`. Portal/login/API: `no-store`.
- Limites: formulário de desafio — 5/h por origem (memória do processo + banco) e 3/dia por e-mail (banco); honeypot + tempo mínimo de 3 s. Login: limites do Supabase Auth.
- Autorização: RLS em toda tabela privada; `anon` só lê `public_publication`. Testes em `tests/rls/*` (Postgres embutido) rodam no CI.
- Logs: JSON por linha (`src/lib/observability/log.ts`), chaves sensíveis redigidas, sem corpo de requisição. Erros de servidor via `instrumentation.ts#onRequestError` (rota, método, digest).

## 4. Backup e restauração

- Backups diários automáticos do Supabase (plano define retenção; PITR se contratado). Restauração: Dashboard → Database → Backups → restaurar para novo projeto → apontar `NEXT_PUBLIC_SUPABASE_URL`/chaves → `db:push` não é necessário (schema vem com o backup).
- Export manual antes de migrações destrutivas: `pg_dump --no-owner --format=custom "$SUPABASE_DB_URL" > backup-$(date +%F).dump` (senha do banco só na máquina do operador).
- Ensaio de restauração: `[CONTEÚDO PENDENTE]` — agendar trimestralmente e registrar data/resultado aqui.
- `audit_event`, `activity_event`, `crm_event`, `content_revision`, `publication` e `report_snapshot` são append-only: um restore parcial deve preservar essas tabelas.

## 5. Incidentes (passos reversíveis primeiro)

| Situação | Ação imediata | Depois |
|---|---|---|
| Conteúdo indevido no site | Portal → Conteúdos → item → **Despublicar** (motivo obrigatório; auditado; cache invalidado). | Corrigir → nova aprovação → publicar; ou **Restaurar** revisão anterior. |
| Conta comprometida | Portal → Pessoas → situação **Desativada** (admin; auditado). Sessão existente perde acesso na próxima requisição (RLS lê o status). | Rotacionar senha via Supabase Auth; revisar `audit_event` do ator. |
| Chave vazada | Supabase → Settings → API → rotacionar `service_role`/`anon`; atualizar variáveis; redeploy. | Revisar logs do período; `CHALLENGE_HASH_SECRET` novo. |
| Arquivo com problema de consentimento | Portal → Arquivos → arquivo → consentimento **Recusado** / situação **Revogado** (auditado); despublicar conteúdo que o usa como capa. `/api/midia/<id>` e o original no Portal param de responder (cache público de no máximo 5 min). | Remover no provedor conforme política (17: remoção pública não apaga o original sem política). |
| Drive não responde / "sem acesso" na verificação | Conferir que a pasta está compartilhada com `GOOGLE_SERVICE_ACCOUNT_EMAIL` e que o arquivo está dentro de `GOOGLE_DRIVE_ROOT_FOLDER_ID` (quando definida). Chave rotacionada no Google ⇒ atualizar `GOOGLE_SERVICE_ACCOUNT_KEY` e redeploy. | Revisar `audit_event` `file.access`/`file.verified` do período. |
| Spam no formulário de desafio | Verificar `public_submission_rate`; ajustar limites na função `submit_research_challenge` por migration. | Avaliar captcha só se necessário (21: anti-spam sem depender de terceiros por padrão). |
| Portal fora (503) | Conferir variáveis `NEXT_PUBLIC_SUPABASE_*` e status do Supabase. | `/api/health` no monitor. |
| E-mails não chegam | Portal → Configurações → E-mails: contadores e **Enviar pendentes agora** (auditado). `failed` com `last_error` `http 4xx` = chave/remetente/destinatário inválidos no Resend; `queued` com tentativas = provedor fora (até 5 tentativas, reserva expira em 10 min). | Corrigir variáveis e redeploy; cron `POST /api/mail/dispatch` (Bearer `MAIL_DISPATCH_SECRET`) a cada 5–15 min reprocessa o que ficou. |

## 6. Monitoramento e SLO

- Monitor externo em `/api/health` a cada 1–5 min; alerta em 2 falhas consecutivas.
- Métricas mínimas: taxa de erro 5xx, p95 de resposta, falhas de login, envios de desafio/h, publicações/despublicações (auditoria).
- SLOs aprovados: `[CONTEÚDO PENDENTE]` (proposta inicial: disponibilidade mensal 99,5 % site / 99 % Portal; p95 < 1,5 s no site).
- Sink de erros/APM: `[CONTEÚDO PENDENTE]` — decisão de provedor; o formato de log já é estruturado.

## 7. Rotinas

- Semanal: revisar fila `/portal/desafios?situacao=received` e `/portal/conteudos?situacao=review`; conferir `failed` em Configurações → E-mails.
- Mensal: `npm audit`, atualização de dependências, revisão de acessos (Pessoas: pendentes/desativados, grants externos vencidos).
- Trimestral: ensaio de restore; revisão de retenção de dados de desafios (decisão institucional pendente).
