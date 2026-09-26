# ACT-003: checklist, menções, ações no projeto/missão e responsáveis de qualquer papel

Data: 2026-09-26 · Etapa 3 das Ações (continua `ACT-001` e `ACT-002`)

## O que foi entregue

| Funcionalidade | Como funciona | Onde |
|---|---|---|
| **Checklist** | Passos marcáveis na página da ação, com progresso ("1 de 2 passos") e selo ✓ 1/2 nos cartões. Responsável e administração/coordenação editam; aprovador de fora só vê. Concluir um passo vai para o histórico (desmarcar não, para não virar ruído). | `WorkItemChecklist`, `checklistWorkItem` |
| **Menções** | Ao comentar, "Avisar (menção)" lista só quem já participa da ação (admin, coordenação, responsável, aprovador). A menção aparece na **Minha mesa** (e no Início de quem não é da coordenação) em "Menções para você" até a pessoa comentar na ação; não há estado de "lido". Mencionar **não dá acesso** a ninguém. | `WorkItemComment`, `listMyMentions`, `MentionList` |
| **Ações no projeto e na missão** | Bloco "Ações" na visão geral do projeto e na página da missão, com "Nova ação neste projeto/missão" (vínculo já preenchido). Ação ligada a uma missão herda o projeto dela. Membros do projeto só veem as ações que são deles. | `LinkedWorkItems`, `listLinkedWorkItems` |
| **Responsáveis de qualquer papel** | Qualquer conta ativa pode ser responsável ou aprovadora (admin/coordenação primeiro; os demais com o papel ao lado). Quem não é da coordenação vê só o item que recebeu (Início → "Ações com você"), anda com o status, marca o checklist, comenta e anexa. Não edita dados nem vê a lista geral. | `listAssignablePeople`, `personOption` |

## Banco

- `20260927000400_work_items_collab.sql`:
  - tabela `work_item_checklist_item` com RLS (`can_work_on_item`);
  - coluna `mentions` em `work_item_comment`, com guarda que só aceita participantes (`profile_can_view_work_item`);
  - trigger que faz a ação ligada a uma missão herdar o projeto dela e recusa missão de outro projeto.
- `20260927000500_work_item_participants.sql`: função `work_item_participants(item)`, que devolve só o nome de exibição de quem aparece na ação e de quem pode ser mencionado, e apenas a quem pode ver a ação.

## Correção encontrada no caminho

A RLS de `profile` só mostra perfis que dividem projeto com a pessoa. Com isso, um responsável de fora da coordenação veria "Sistema" no histórico e um "Aguardando aprovação de" em branco. A função de participantes resolve sem abrir a tabela de perfis. O e2e confere que o membro vê o nome da administração no histórico.

## Testes

- **RLS (18):** checklist (quem edita, quem só vê, histórico do passo), menção só para participantes e sem dar acesso, missão herda projeto e recusa outro projeto, participantes visíveis ao responsável e nada para quem não vê a ação.
- **E2E `work-items-collab.spec.ts` (5):**
  - ação criada no projeto já ligada a ele, com checklist, progresso e histórico, e visível no bloco do projeto;
  - ação atribuída a um membro, que a vê no Início, vê o nome de quem criou, marca o passo, não edita dados e menciona a administração;
  - a menção aparece na Minha mesa e some depois da resposta.
- Limpeza: 6 ações de teste que ficaram abertas por execuções com falha foram canceladas.

## Próximas etapas

4. Templates (visita técnica primeiro), resumo diário/semanal na Minha mesa e na Central, e-mails para eventos importantes (quando o Resend estiver configurado).
