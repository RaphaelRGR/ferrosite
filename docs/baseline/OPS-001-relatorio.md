# OPS-001 — observabilidade e hardening

Data: 2026-09-15 · Fase F6 · Docs 21, 22, 27

## Entregue

| Área | Implementação |
|---|---|
| Cabeçalhos (21) | `next.config.ts`: CSP após inventário de origens (fontes self-hosted via `next/font`, mídia local, `connect-src` só Supabase), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests` e HSTS em produção, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, sem `X-Powered-By`; Portal/login/API com `no-store`. |
| Logs estruturados | `src/lib/observability/log.ts`: uma linha JSON por evento, chaves sensíveis redigidas (token, senha, cookie, authorization, service role…), strings longas cortadas, stack só fora de produção; `correlationId` do provedor quando existir. |
| Erros | `src/instrumentation.ts` (`register` + `onRequestError`: rota, método, digest — sem corpo/cabeçalhos); error boundaries do site e do Portal relatam via `reportClientError` (nome, mensagem, digest, rota). |
| Health | `GET /api/health`: vivo/configurado, sem segredos, `no-store`, não toca o banco. |
| Limites/anti-spam | já em CRM-001 (memória + banco, honeypot, tempo mínimo); documentados no runbook. |
| Runbook | `docs/ops/runbook.md`: variáveis, deploy, migrations, backup/restore (Supabase + `pg_dump`), rotação de chaves, incidentes reversíveis (despublicar, desativar conta, revogar arquivo), monitoramento e rotinas; SLOs e sink de erros marcados `[CONTEÚDO PENDENTE]` (decisão institucional/provedor). |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **135/135** (novo `observability.test.ts`: redação em profundidade, corte, erro sem stack em produção, linha JSON) · build ok · `npm run test:e2e` **253/253** (novo `security-headers.spec.ts`: CSP/nosniff/DENY/referrer/permissions sem `unsafe-eval` em produção, sem `X-Powered-By`, `no-store` no Portal, health sem segredos). Todas as suítes interativas (fluxograma, diálogo, tema, formulários) continuam passando sob a CSP.

## Decisões

1. `script-src 'unsafe-inline'` em vez de nonce: nonce exigiria renderização dinâmica de todo o site público (perda de SSG/ISR); compensado com `object-src`, `base-uri`, `form-action` e `frame-ancestors` estritos. Reavaliar se o site passar a ser dinâmico.
2. Sink de logs/erros (APM) não escolhido: formato pronto para qualquer coletor de stdout; nada de terceiros até decisão (21: privacidade).
3. Health não consulta o banco para não virar vetor de carga; checagem profunda fica com o monitor do provedor.

## Pendências

- SLOs aprovados, ensaio de restore com data registrada, provedor de APM/e-mail.
- Rotação das chaves usadas na configuração inicial antes de ir ao ar.
