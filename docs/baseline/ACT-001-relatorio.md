# ACT-001: Ações, Minha mesa e Central da coordenação (MVP)

Data: 2026-09-26 · Pedido do usuário "Central da Coordenação" (seções 44/45) · Docs 05, 10, 12, 17

## Problema

A comunicação operacional entre administração e coordenação acontecia no
WhatsApp: pedidos, prazos, aprovações e arquivos se perdiam na conversa. Objetivo:
**WhatsApp = conversa; Portal = compromisso, acompanhamento e memória.**

## O que foi entregue

| Parte | Onde |
|---|---|
| Schema, guarda de transições, histórico por trigger e RLS | `supabase/migrations/20260927000100_work_items.sql` |
| Regras espelhadas (transições, prazo, Minha mesa, carga da equipe, espera) | `src/lib/portal/work-items.ts` |
| Leituras / Server Actions | `lib/portal/queries/work-items.ts`, `lib/portal/actions/work-items.ts` |
| "+ Criar" no cabeçalho (o quê, quem, quando + "Mais opções") | `components/portal/work-items/QuickCreate.tsx`, `(portal)/layout.tsx` |
| **Minha mesa** (Início de admin/coordenação) | `components/portal/work-items/Desk.tsx`, `(portal)/portal/page.tsx` |
| Lista de Ações (Abertas · Aguardando por quem · Aprovações · Concluídas; filtro de responsável) | `(portal)/portal/acoes/page.tsx` |
| Página da ação (andamento, aguardando, aprovar/pedir alteração, decisão, arquivos, linha do tempo, edição) | `(portal)/portal/acoes/[id]/page.tsx`, `WorkItemForms.tsx`, `Timeline.tsx` |
| Central da coordenação evoluída: precisa da sua atenção, aguardando equipe, atenção, próximos prazos; alertas do COORD-001 viram "Sinais do Portal" | `(portal)/portal/coordenacao/page.tsx` |
| Envio de arquivo direto para a ação (Drive `coordenacao/acoes/<ano>/<id>`) | `lib/files/upload.ts`, `UploadForm`, `/portal/arquivos/enviar?acao=` |
| Membros com item atribuído veem "Ações com você" no Início | `(portal)/portal/page.tsx` |

## Modelo

- `work_item`:
  - tipos: ação, aprovação, decisão, follow-up;
  - situação: entrada, planejada, em execução, aguardando, bloqueada, aguardando aprovação, concluída, cancelada;
  - um único responsável, prazo, aprovador e "aguardando quem" (10 partes), com nota e "desde" automático;
  - vínculos opcionais com projeto, missão e empresa;
  - já prevê as etapas 2 e 3: Lembrar depois (`snoozed_until`) e decisão com opções.
- `work_item_event`: histórico escrito só por trigger. Registra criação, status, aguardando, aprovação pedida, aprovado, alteração pedida, decisão, responsável, prazo, aprovador, prioridade e arquivos.
- `work_item_comment` e `work_item_file` (vínculo com `file_asset`).
- `can_view_file` ganhou uma condição: arquivo vinculado a uma ação que a pessoa vê.

## Regras (banco = autoridade; TypeScript espelha)

- **Acesso:** admin e coordenação veem e criam tudo. Outra pessoa só vê o item em que é responsável ou aprovadora, com comentários, histórico e arquivos dele. Conta comum e anônimo não veem nada.
- **Edição:** quem não é da coordenação só muda o andamento do próprio item; responsável, prazo e dados ficam com a administração e a coordenação.
- **Aprovação:**
  - só o aprovador aprova ou pede alteração, e pedir alteração exige nota;
  - o responsável não aprova a própria entrega;
  - item com aprovador só é concluído pela aprovação.
- **Reabrir** item concluído ou cancelado é da administração e da coordenação.
- **Sem exclusão:** cancelar é o caminho.

## Decisões

- **Tabelas novas** em vez de reaproveitar `mission` (que exige projeto e segue a RLS de membros) ou `approval_request` (que é específica de Conteúdos).
- **Minha mesa substitui o Início** para admin e coordenação (escolha do usuário); os demais perfis continuam com o Início atual.
- **Responsáveis no MVP:** a lista de pessoas mostra só admins e coordenação ativos. O banco já aceita outra pessoa por item (exceção); abrir a lista a outros perfis fica para a etapa 3.
- **Notificações:** só dentro do Portal (contadores da Mesa). E-mail fica para depois (Resend ainda não configurado).
- **Correção durante o desenvolvimento:** um `revoke all ... from anon` genérico no fim da migration apagaria o acesso anônimo às views públicas do site. O teste RLS pegou o problema antes do push; o revoke ficou restrito às tabelas novas.

## Critérios de aceite (seção 45)

| # | Critério | Evidência |
|---|---|---|
| 1-3 | comum não acessa; admin e coordenação acessam | e2e `work-items` (member: "não encontrado" em Ações, Central e item) + RLS |
| 4-6 | criar em segundos com responsável e prazo | "+ Criar" com 3 campos; e2e cria com "Amanhã" |
| 7 | coordenação pede ação à administração | e2e: revisor cria pedido com responsável = admin; aparece na Mesa do admin |
| 8-10 | pedir aprovação, aprovar, solicitar alteração | e2e + RLS (só o aprovador; nota obrigatória) |
| 11 | histórico registra | e2e verifica created, waiting, approval_requested, changes_requested, approved |
| 12-13 | "Aguardando" e quem é aguardado | e2e marca "Empresa · Rumo confirmar a lista · desde…" |
| 14 | arquivo do Drive relacionado | e2e vincula arquivo; RLS: visível só a quem vê a ação |
| 15-16 | Minha mesa relevante; Central destaca aprovações/decisões | unit `buildDesk` + e2e (seções "Aguardando aprovação" e "Aprovações e decisões com você") |
| 17-19 | mobile, claro, escuro | capturas 320/375/414/1366 px sem rolagem horizontal; temas conferidos |
| 20 | controle no banco | `tests/rls/work-items.test.ts` (10 cenários) |

## Testes

- **Unit:** `tests/unit/work-items.test.ts`
  - transições dentro da máquina do banco;
  - aprovação só pelo aprovador;
  - prazo "hoje/amanhã/esta semana" no fuso do curso, inclusive perto da meia-noite;
  - seções da Mesa, carga da equipe, agrupamento por quem é aguardado;
  - textos PT/EN.
- **RLS:** `tests/rls/work-items.test.ts` (10) e suíte completa (79 + 1 pulado).
- **E2E:** `tests/e2e/work-items.spec.ts` (6) e `coordination.spec.ts` atualizado.

## Pendente (próximas etapas)

1. **Etapa 2:** Entrada/triagem (aceitar, atribuir, adiar, arquivar), tela de Bloqueios dedicada, Lembrar depois, decisão com opções (as colunas já existem).
2. **Etapa 3:** checklist, menções, ações na página do projeto e da missão, responsáveis além de admin e coordenação.
3. **Etapa 4:** templates (visita técnica primeiro), resumo semanal, e-mails.
4. **Depende do usuário:** convidar a conta da coordenadora (Andrea) no Portal com o papel coordenação.
