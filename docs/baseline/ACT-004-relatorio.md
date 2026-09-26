# ACT-004: processos a partir de modelos, resumos e e-mails

Data: 2026-09-26 · Etapa 4 das Ações (continua `ACT-001` a `ACT-003`)

## O que foi entregue

| Funcionalidade | Como funciona | Onde |
|---|---|---|
| **Processos a partir de modelos** | Em Ações → Processos, "Usar este modelo" abre um formulário curto (nome, data do evento, responsável, quem aprova o relatório, empresa, projeto) com a prévia de todas as ações por etapa. Criar gera o processo inteiro de uma vez, com prazos contados da data (18:00; prazo já passado vira "hoje"), checklist de EPI e o relatório como aprovação. A página do processo mostra o progresso geral e por etapa; cada ação aponta de volta para o processo. | `src/content/work-templates.ts`, `/portal/acoes/processos/**`, `create_work_process()` |
| **Modelo "Visita técnica"** | 8 etapas e 25 ações: Planejamento, Participantes, Segurança (EPI: botas, óculos, colete), Logística, Empresa, Execução, Pós-visita (relatório com aprovação, fotos, vídeo, postagem, site) e Encerramento. | `TECHNICAL_VISIT` |
| **Resumo do dia** | No topo da Minha mesa: uma frase ("2 para hoje · 1 atrasada · 1 aprovação com você") e a lista de hoje, com **Copiar resumo** para mandar no WhatsApp. | `Desk.tsx` |
| **Resumo da semana** | Na Central da coordenação, desde segunda: concluídas, novas, atrasadas e aguardando aprovação; por pessoa (✓ feito · ○ a fazer) e próximos 7 dias, com **Copiar para enviar**. | `WeeklySummary.tsx`, `weeklySummary()` |
| **E-mails dos eventos importantes** | Recebeu ação, pediram aprovação, pediram alteração (com o que ajustar), menção, vence em 24 h, atrasou, processo criado com você. Nunca para quem fez a mudança; um processo gera um aviso, não 25. Ficam na fila (`mail_outbox`) e saem quando o Resend estiver configurado. | migration `20260927000600`, `lib/mail/templates.ts`, `lib/mail/reminders.ts` |

## Banco

`20260927000600_work_processes_mail.sql`:
- tabela `work_process`;
- colunas `process_id`, `process_phase` e `process_position` em `work_item`, e guarda que impede quem não é da coordenação de mexer nelas;
- `create_work_process(p_process, p_items)`, *security invoker* (a RLS do usuário vale) e transacional: ação inválida desfaz tudo;
- lista de modelos de e-mail ampliada e triggers de e-mail das ações, das menções e do processo;
- `work_item_reminder` com `enqueue_work_item_reminders()` (só *service role*): um lembrete por prazo; mudar o prazo permite um novo.

## Decisões

- **Modelos em código** (`src/content/work-templates.ts`), versionados no git, em vez de tabela editável: o primeiro modelo precisava sair rápido e a estrutura (etapas, prazos relativos, aprovação, checklist) já comporta os próximos. Editá-los pelo Portal fica para depois, se houver demanda.
- **O processo não é uma missão**: missão exige projeto, e visita técnica muitas vezes não tem um. O processo pode ser ligado a um projeto, e suas ações seguem as mesmas regras de qualquer ação.
- **Resumos calculados dos dados**, sem texto digitado à mão; o botão "Copiar" leva o resumo para o WhatsApp (conversa lá, compromisso aqui).
- **Lembretes** entram na fila pelo cron que já existe (`POST /api/mail/dispatch`). Sem cron e sem Resend, nada sai, mas nada se perde.

## Testes

- **Unit (233):** prazos do modelo (dias antes/depois, passado vira hoje, aprovação sem aprovador vira ação), chaves únicas dos modelos, progresso sem canceladas, início da semana (inclusive domingo à noite em Joinville), resumo semanal por pessoa, e-mails novos em PT/EN.
- **RLS (21):** processo cria ações e passos numa transação e desfaz tudo em erro; membro não cria; o responsável de fora vê o nome do processo e não tira a ação dele; e-mails vão para quem deve e nunca para quem agiu; um aviso por processo; lembretes só pelo *service role* e sem repetir.
- **E2E `work-processes.spec.ts` (3):** criar processo de visita técnica pela interface (etapas, checklist de EPI, aprovador no relatório); resumo do dia e da semana com botão de copiar; limpeza cancelando as ações de teste.

## Para funcionar por completo (depende do usuário)

1. Credenciais do Resend (`RESEND_API_KEY`, `MAIL_FROM`) na Vercel.
2. `MAIL_DISPATCH_SECRET` e um cron (a cada hora, por exemplo) chamando `POST /api/mail/dispatch` com `Authorization: Bearer <segredo>`. Ele entrega a fila e enfileira os lembretes de prazo.

## Próximos modelos previstos

FerroCard, Evento, Projeto de extensão, Projeto de P&D, Missão internacional, Edital, Documento da coordenação, Portfólio de laboratório: cada um é um objeto em `WORK_TEMPLATES`.
