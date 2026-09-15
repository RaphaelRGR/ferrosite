# CRM-001 — organizações, pipeline de parceria e desafios de P&D

Data: 2026-09-15 · Fase F5 · Depende de AUTH-003, PORTAL-002, LAB-001 · Docs 13, 14, 20, 21

## Entregue

### Banco (`supabase/migrations/20260915000300_crm.sql`)

| Área | Implementação |
|---|---|
| Organização ≠ contato (13) | `organization` (tipo, setor, cidade/UF/país, site, responsável interno, notas restritas, `public_partner` só com `brand_authorized_at`), `contact` (nome, cargo, e-mail, telefone, base/consentimento), `relationship_activity` (tipo, quando, resumo, próxima ação + prazo). Sem DELETE (arquivar). |
| Pipeline (13) | `stage` Mapeado → Contato → Reunião → Proposta → Negociação → Confirmado; Perdido/Pausado **exigem motivo**; toda transição registra ator/data em `crm_event`. "Parceiro público" só por overseer, com autorização de marca, **auditado**. |
| Desafio (13/14) | `research_challenge` com protocolo `DES-AAAA-NNNNNN`, organização informada + vínculo posterior, contato, título, descrição, áreas da taxonomia, confidencialidade solicitada, `consent_at`, situação Recebido → Triagem → Encaminhado → Proposta → Aceito/Recusado → Encerrado (trigger), responsável pela triagem, notas. Atribuição/vínculo/situação registrados em `crm_event`. |
| Envio público (21) | `submit_research_challenge(...)` **security definer executável só pelo service role**; limite no banco (5/h por origem hasheada, 3/dia por e-mail) via `consume_submission_budget`; `audit_event` com protocolo e origem **sem PII**; nunca lida por `anon`. |
| RLS | CRM inteiro restrito a admin/coordenação; orientador vê/atualiza só desafios atribuídos a ele; `crm_event` só overseers; `public_submission_rate` sem policies. |

### Aplicação

- Site: `/[locale]/para-empresas/desafio` — formulário real em PT/EN (interface), consentimento obrigatório, honeypot fora da tabulação, tempo mínimo de 3 s, limite em memória por origem (HMAC do IP com segredo do servidor; IP nunca armazenado), chamada via `src/lib/supabase/admin.ts` (service role só no servidor), confirmação **só com protocolo** (dados não ecoados); valores digitados preservados em erro (React 19 limpa o form). "Para Empresas" passa a apontar para o formulário; texto de retenção continua `[CONTEÚDO PENDENTE]`.
- Portal: `/portal/empresas` (lista por etapa, estado de URL), `/portal/empresas/nova`, `/portal/empresas/[id]` (dados, edição com versão, pipeline com motivo, contatos, interações com próxima ação, histórico), `/portal/desafios` (lista por situação; orientador só os seus), `/portal/desafios/[id]` (dados restritos, **laboratórios relacionados pela capacidade administrada** com nível descrita/potencial — orientação, não promessa —, triagem: situação/atribuição/vínculo/notas, histórico). Itens de menu por papel.
- `ActionState.values`: todas as Server Actions do Portal devolvem os valores digitados em erro e os formulários os repovoam.

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **127/127** (novo `challenge-form.test.ts`: normalização, campos inválidos, corte 6000, honeypot/tempo, limite em memória) · `npm run test:rls` **36/36** (novo `crm.test.ts`: restrição por papel, contatos/interações, pipeline com motivo e histórico, parceiro público auditado, sem exclusão; envio só service role, protocolo, auditoria sem PII, limites por origem e por e-mail, orientador só atribuído, cadeia de triagem, vínculo registrado) · build ok · `npm run test:e2e` **243/243** (novo `challenge.spec.ts`: CTA → formulário, consentimento obrigatório, honeypot fora do fluxo, anti-bot por tempo, valores preservados, confirmação sem eco de dados; rotas novas do Portal em smoke/redirect; axe estrito no formulário PT/EN).

## Decisões

1. Envio público via **service role no servidor** + função restrita, em vez de RPC anônimo: o hash de origem não pode ser forjado por chamada direta à API.
2. Sem anexos no formulário (21: upload exige MIME/magic bytes/malware scan — FILE-001); o texto avisa que a coordenação pede por canal seguro.
3. Retenção dos dados do desafio é decisão institucional pendente (`[CONTEÚDO PENDENTE]` visível no formulário).
4. Notificação por e-mail à coordenação ao receber desafio não foi implementada (sem provedor de e-mail aprovado) — a fila é a lista `/portal/desafios` com "Recebido" em destaque.

## Pendências

- Aplicar migrations na nuvem e rodar o e2e com protocolo real.
- Provedor de e-mail para notificar coordenação/empresa (fora do escopo; sem provedor aprovado).
- Logos de parceiros no site: `public_partner` + autorização existem; a projeção pública entra com PUB-001.
