# Projetos e missões

## Projeto

Campos mínimos: ID, títulos/resumos PT/EN, tipo/categoria, estado, visibilidade, responsáveis, período, progresso derivado, módulos habilitados, capa pública aprovada, timestamps e versão. Módulos possíveis: visão, equipe, missões, pipeline, roadmap, cronograma, arquivos, galeria, reuniões, horas, parceiros, financeiro, indicadores, atualizações, relatórios, histórico e publicação.

Estados precisam de máquina definida. Sugestão inicial: rascunho → planejamento → ativo → pausado → concluído → arquivado; cancelado como terminal separado. “Atrasado” é condição calculada. Arquivar preserva relações e remove do padrão de busca; reativação exige permissão e auditoria.

## Missão

Não é tarefa simples: título, descrição, projeto, responsável, participantes, prazo/timezone, prioridade, status, entregáveis, checklist, anexos, comentários, horas, validação, dependências e histórico. Fluxo: Planejada → Em execução → Em validação → Concluída; Pausada/Cancelada por transição autorizada. Atrasada é `due_at < now` e não terminal.

Kanban, lista e calendário são três visões da mesma entidade/consulta. Alterar status em qualquer visão reflete nas outras e registra transição. Drag-and-drop nunca é o único mecanismo.

## Pipeline reutilizável

Definição versionada + etapas ordenadas + regras de transição + itens + histórico. Templates iniciais: Comunicação, Parceria, Engenharia, Edital e P&D. Customização é controlada; alterar template não reescreve o histórico de instâncias existentes.

## Concorrência e integridade

Usar versão/`updated_at` para detectar edição concorrente; mutation idempotente; responsável deve ter acesso ao projeto; conclusão pode exigir entregáveis/validação; remover membro com missão aberta exige reatribuição explícita.

## Aceite

- membro do projeto A não acessa B por ID;
- projeto arquivado permanece consultável conforme permissão;
- transição inválida falha no servidor;
- atualização concorrente não é perdida silenciosamente;
- histórico identifica ator/origem/destino/data;
- telas cobrem vazio/loading/erro e os dois temas.
