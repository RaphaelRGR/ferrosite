# OPS-002 — sink de erros (webhook genérico)

Data: 2026-09-21 · Fora do backlog original (30); fecha a pendência "sink de erros/APM" de OPS-001 e do runbook. Docs 21, 22.

## Entregue

| Área | Implementação |
|---|---|
| Sink | `src/lib/observability/sink.ts`: `ERROR_SINK_URL` (só HTTPS), `ERROR_SINK_TOKEN` (Bearer opcional), `ERROR_SINK_LEVEL` (`error` padrão ou `warn`). `POST` JSON `{ service, env, version, dropped, events: [evento] }`, timeout 5 s, `keepalive`; nunca lança nem bloqueia; contadores `sent/failed/dropped`; **60 eventos/min por processo** (excedente descartado e informado no próximo envio). Sem SDK de terceiros: o provedor é uma URL. |
| Encaminhamento | `logEvent` (mesmo módulo de OPS-001) passa `error`/`warn` **já redigidos** ao sink — inclui `request.error` do `instrumentation.ts`, falhas de e-mail/Drive e o evento de teste. |
| Navegador | `reportClientError` agora também faz `POST /api/telemetry` (`keepalive`, sem cookies). Rota: corpo ≤ 4 KB, contrato fixo (`scope`, `name`, `message`, `digest`, `path` relativo), 30/min por origem **hasheada**, resposta 204 sem eco; vira `client.error` no log e no sink. |
| Portal | Configurações → **Observabilidade** (admin): estado do sink e **Enviar evento de teste** (gera `sink.test`, audita `observability.test` com os contadores). `/api/health` expõe `errorSinkConfigured`. |
| Operação | `.env.example`, runbook (variáveis, contrato do webhook, validação), README, addenda 01/33/ENTREGA-FINAL. Sem migration. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **160/160** (novo `sink.test.ts`: só HTTPS configura; POST com Bearer/serviço/versão; nível mínimo; falha HTTP/rede não lança; limite 60/min e `dropped` informado; `logEvent` encaminha error/warn redigidos e não info; no-op sem configuração; contrato do relato do navegador, corte de tamanhos, caminho estranho recusado, corpo grande, 30/min por origem) · `npm run test:rls` 58/58 (inalterado) · build 84 páginas + `/api/telemetry` · `npm run test:e2e` 263 (novo em `security-headers`: telemetria 204 sem eco, 400 para contrato/JSON/tamanho inválidos, `errorSinkConfigured` no health; `portal-journey`: painel Observabilidade e evento de teste auditado).

Na rodada completa desta data, 260 passaram e o passo "empresa e desafio" da jornada falhou por causa **legítima**: o limite anti-spam do banco (5 envios/h por origem, CRM-001) foi atingido pelas rodadas repetidas do dia a partir desta máquina; os 2 passos seriais seguintes não correram. Os mesmos passos passaram na rodada anterior (12/12) e a jornada completa passou 8/8 antes do limite. O spec agora falha rápido com a explicação em vez de esperar o timeout.

Sem webhook real configurado o envio é coberto com `fetch` simulado; a validação com o coletor escolhido é o botão do Portal.

## Decisões

1. Webhook genérico em vez de SDK (Sentry etc.): a decisão de provedor é institucional (21: privacidade, contrato); qualquer coletor que aceite JSON entra sem código novo. Se um dia for exigido o envelope do Sentry, é um adaptador a mais no mesmo módulo.
2. Envio imediato por evento (sem lote): erros são raros; lote traria perda em ambiente serverless ao congelar o processo.
3. `/api/telemetry` é público por necessidade (o site quebra sem login), por isso é o endpoint mais restrito do sistema: contrato rígido, sem eco, limite por origem hasheada, e o corpo nunca é registrado além dos campos validados.
4. SLOs e provedor continuam `[CONTEÚDO PENDENTE]`.

## Depende do usuário

Escolher o coletor e definir `ERROR_SINK_URL` (+ `ERROR_SINK_TOKEN`); opcionalmente `ERROR_SINK_LEVEL=warn`. Validar com Configurações → Observabilidade → Enviar evento de teste.
