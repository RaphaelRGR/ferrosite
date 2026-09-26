# ACT-002: Entrada, Bloqueios, Lembrar depois e decisão com opções

Data: 2026-09-26 · Etapa 2 das Ações (continua `ACT-001-relatorio.md`)

## O que foi entregue

| Funcionalidade | Como funciona | Onde |
|---|---|---|
| **Entrada** | "+ Nova ação" com responsável "Ninguém ainda" cria o item na Entrada. A aba Entrada mostra cada item com **Aceitar** (responsável + quando), **Lembrar depois** e **Arquivar**. A Minha mesa avisa "Na Entrada: N para organizar"; a Central conta "Na Entrada (sem responsável)". | `acoes/page.tsx`, `WorkItemTriage`, `acceptWorkItem` |
| **Bloqueios** | Aba que junta tudo que está parado (aguardando terceiros, bloqueadas, aguardando aprovação), com o resumo "N ações paradas" e atalhos por quem esperamos (Empresa, Fornecedor…). O endereço antigo `?aba=aguardando` continua funcionando. | `BlocksView` em `acoes/page.tsx` |
| **Lembrar depois** | Amanhã, semana que vem (segunda), próximo mês ou data escolhida, sempre às 08:00 no fuso do curso. O item some das listas e da Mesa até a data (aba **Adiadas**) e volta sozinho; "Trazer de volta" desfaz. Responsável ou coordenação podem adiar. | `resolveSnooze`, `WorkItemSnooze`, `snoozeWorkItem` |
| **Decisão com opções** | Em "Mais opções", o tipo Decisão pede as opções (uma por linha, até 8). Quem decide escolhe uma ou escreve "Outra"; fica registrado "Decisão: …" e "Decidido por … em …". | `WorkItemDecision`, `decideWorkItem` |

## Banco

- `20260927000200_work_items_triage.sql`: histórico de "lembrar depois" (`snoozed`/`unsnoozed`) por trigger; opções de decisão validadas (até 8, sem vazias, até 200 caracteres).
- `20260927000300_work_item_archive_inbox.sql`: **correção** que permite arquivar um item da Entrada sem responsável. Reabrir um arquivado sem responsável volta para a Entrada. Sem isso, "Arquivar" na Entrada falhava; o erro apareceu na conferência visual, não nos testes, e o caso agora tem teste de RLS, unit e e2e.

## Decisões

- A **Entrada** é um estado (`inbox`), não uma lista separada: o mesmo item segue da triagem até a conclusão com o histórico completo.
- **"Adiar" não muda o estado**: o item continua planejado, em execução etc.; só fica fora das listas até a data.
- Na Entrada, "Aceitar" é um formulário (responsável + prazo), não um botão de estado, porque o banco exige responsável fora da Entrada.

## Testes

- Unit: `filterTab` (abas e adiados), `resolveSnooze` (fim de semana, virada de mês e de ano, "hoje não é depois"), arquivar e reabrir pela Entrada.
- RLS (14): Entrada, aceitar exige responsável, só a coordenação cria na Entrada, adiar registra histórico, limites das opções, quem não é da coordenação não muda opções, arquivar e reabrir sem responsável.
- E2E `work-items-triage.spec.ts` (7): Entrada → aceitar; lembrar depois → Adiadas → trazer de volta; Bloqueios por Fornecedor; decisão com opções escolhida pela coordenação; arquivar direto da Entrada.

## Próximas etapas

3. Checklist, menções, ações dentro do projeto e da missão, responsáveis além de admin e coordenação.
4. Templates (visita técnica primeiro), resumo diário/semanal, e-mails.
