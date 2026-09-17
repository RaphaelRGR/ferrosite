# MAIL-001 — e-mail transacional

Data: 2026-09-17 · Fora do backlog original (30); gancho registrado em 33 ("provedor de e-mail") e escolhido pelo usuário (Resend). Docs 11, 13, 18, 21.

## Entregue

| Área | Implementação |
|---|---|
| Fila no banco (fonte única) | Migration 7 `20260917000100_mail.sql`: `mail_outbox` (template, idioma, destinatário, payload mínimo, status `queued/sent/failed`, tentativas, reserva, erro). RLS: só **admin lê**; ninguém autenticado insere/edita; `anon` sem acesso. Enfileirar é só por funções `security definer` revogadas de `anon/authenticated`. |
| Eventos (triggers) | `challenge_received` (AFTER INSERT em `research_challenge`, idioma do envio; payload só protocolo/título/nome — **nunca a descrição**); `content_review_requested` para admin/coordenação ativos, exceto o autor; `content_decided` (aprovado/alterações) e `content_published` para o autor; `membership_granted` ao entrar em projeto ou mudar papel/prazo (não repete em update sem efeito). Destinatários internos só se **perfil ativo**, no idioma da preferência (PT padrão). |
| Entrega | `claim_mail_outbox` (service role; `FOR UPDATE SKIP LOCKED`, reserva expira em 10 min, máx. 5 tentativas) e `settle_mail_outbox` (enviado / re-enfileira / falha definitiva). `src/lib/mail/dispatch.ts` corre **depois da resposta** (`after()` de `next/server`) nas ações que enfileiram (envio do desafio, transição de conteúdo, adicionar membro) e sob demanda em `POST /api/mail/dispatch` (Bearer `MAIL_DISPATCH_SECRET`; sem segredo → 404). |
| Provedor | `src/lib/mail/provider.ts`: interface `MailProvider` + Resend pela API HTTP com `fetch` (sem SDK — uma chamada REST não justifica dependência). 4xx = definitivo; 429/5xx/rede = transitório. Sem `RESEND_API_KEY`/`MAIL_FROM` a fila acumula e nada se perde. |
| Templates | `src/lib/mail/templates.ts`: PT e EN completos (sem fallback), texto + HTML mínimo com escape, links só quando `NEXT_PUBLIC_SITE_URL` existe (não inventa domínio), caminho público do conteúdo pelo mesmo mapa do site. |
| Portal | Configurações → **E-mails** (admin): provedor configurado ou não, contadores 30 dias (fila/enviados/falhas, último instante), **Enviar pendentes agora** (auditado `mail.dispatch` com o resumo, sem destinatários). `/api/health` expõe `mailConfigured`. |
| Operação | `.env.example`, runbook (variáveis, incidente "e-mails não chegam", cron), README. Gerador de tipos aprendeu `SETOF <tabela>`. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **144/144** (novo `mail.test.ts`: todos os templates em PT/EN, links/sem domínio, escape/quebras, provedor com Bearer/reply_to/id, classes de erro, dispatch com envio/re-enfileira/falha/template inválido) · `npm run test:rls` **54/54** (novo `mail.test.ts`: triggers e payload sem descrição, aprovadores sem o autor, idioma da preferência, perfil pendente não recebe, sem repetição, RLS/grants, reserva com SKIP LOCKED e tentativas, baixa) · build 84 páginas + `/api/mail/dispatch` · e2e `portal-journey` **8/8** contra a nuvem (novo passo: fila real em Configurações, envio manual auditado, cron 404 sem segredo) · suíte completa: ver ENTREGA-FINAL.

Na nuvem: migration aplicada (host do pooler IPv4 — o direto só resolve em IPv6 nesta rede); a jornada e2e deixou 7 linhas reais em `queued` (1 desafio, 3 revisões, 1 decisão, 1 publicação, 1 ingresso) e o `audit_event` `mail.dispatch` com `configured: false`.

## Decisões

1. Fila no banco em vez de envio direto na action: a autoridade sobre "o que avisar" fica nos triggers (mesma regra dos guards), o envio nunca bloqueia nem falha a ação do usuário, e a entrega sobrevive a instância caída (cron).
2. E-mail para a empresa contém só protocolo/título — a descrição pode ser confidencial (13) e o e-mail não é canal seguro.
3. Aviso de revisão vai a todos os aprovadores ativos (equipe pequena); se crescer, virar preferência por pessoa.
4. Retenção de `mail_outbox` não definida (decisão institucional, junto com a dos desafios): guarda destinatário + payload mínimo; purga futura por migration.

## Depende do usuário

Conta Resend com **domínio verificado** (remetente institucional), `RESEND_API_KEY`, `MAIL_FROM`, opcional `MAIL_REPLY_TO`, `MAIL_DISPATCH_SECRET` + cron (5–15 min) apontando para `/api/mail/dispatch`. Ao configurar, o botão em Configurações escoa a fila acumulada.
