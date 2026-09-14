# Modelo conceitual dos dados

## Identidade e acesso

`auth_user`, `profile`, `global_role`, `permission`, `role_permission`, `project_membership`, `resource_grant`, `user_preference`.

## Núcleo operacional

`project`, `project_translation`, `project_module_config`, `mission`, `mission_assignee`, `mission_participant`, `checklist_item`, `deliverable`, `comment`, `activity_record`, `meeting`, `time_entry`, `milestone`, `status_transition`.

## Pipeline/CRM/P&D

`pipeline_definition`, `pipeline_stage`, `pipeline_item`, `pipeline_transition`; `organization`, `contact`, `relationship_activity`, `opportunity`, `research_challenge`, `capability`, `laboratory`, `researcher`, `equipment`, tabelas de relação.

## Experiência/conteúdo

`experience`, `registration`, `attendance`, `evaluation`, `publication_consent`; `content_item`, `content_translation`, `content_revision`, `approval_request`, `publication`.

## Arquivo/relatório/governança

`file_asset` e vínculos explícitos; `report_definition`, `report_run`, `report_snapshot`; `notification`, `notification_preference`; `audit_event` append-only.

## Regras de modelagem

- IDs opacos; timestamps UTC + timezone de exibição.
- estados como chaves estáveis, rótulos traduzíveis.
- soft delete/arquivamento conforme entidade; retenção explícita.
- tradução em entidade relacionada quando conteúdo é editorial; UI em catálogos de locale.
- FK e constraints para invariantes; validação de app não substitui banco.
- `created_by`, `updated_by`, versão otimista e classificação onde relevante.
- atividade humana e auditoria de segurança são entidades diferentes.
- publicação é snapshot/projeção, não booleano em tabela privada.

## Diagrama resumido

```text
profile --< project_membership >-- project --< mission --< deliverable
project --< activity_record / meeting / time_entry / milestone
organization --< contact / relationship_activity / research_challenge
research_challenge >-- capability >-- laboratory --< researcher/equipment
internal entities --< content_revision --< approval --< publication
all critical mutations --< audit_event
```

Antes de SQL: workshop valida cardinalidades, ownership, exclusão, confidencialidade e relatórios. Depois, migrations versionadas e tipos Supabase gerados substituem o placeholder.
