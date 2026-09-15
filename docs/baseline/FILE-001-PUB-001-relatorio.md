# FILE-001 / PUB-001 — acervo (metadados) e publicação Portal → site

Data: 2026-09-15 · Fase F5 · Depende de PORTAL-002, CRM-001 · Docs 17, 18, 21, 24

## Entregue

### FILE-001 (`supabase/migrations/20260915000400_files.sql`)

| Área | Implementação |
|---|---|
| Modelo (17) | `file_asset` (provedor `google_drive`/`external_link`, `external_id` único por provedor, nome, MIME, tamanho, hash, classificação, situação, crédito, alt PT/EN, **consentimento** + base, dono, versão). Vínculos explícitos `project_file` (capa **única** por projeto, galeria, anexo, documento oficial) e `mission_file`. |
| Segurança (21) | allowlist de tipo/tamanho em tabela (`file_type_allowlist`) aplicada por trigger; nome normalizado (sem caminhos/controle); revogação/arquivamento e mudança de consentimento **auditados**; sem DELETE físico; nenhuma URL pública permanente. |
| RLS | vê: dono, overseer ou membro de projeto/missão com vínculo; registra: qualquer conta ativa (dono = si); vincula: membro do projeto que vê o arquivo; altera/desvincula: overseer, líder ou dono. |
| Portal | `/portal/arquivos` (lista), `/portal/arquivos/novo` (registro de metadados), `/portal/arquivos/[id]` (edição de consentimento/crédito/alt/situação; acesso ao original marcado **[CONTEÚDO PENDENTE]** até haver credencial do Drive), aba **Arquivos** do projeto (vincular/desvincular por uso). |

### PUB-001 (`supabase/migrations/20260915000500_publication.sql`)

| Área | Implementação |
|---|---|
| Fluxo (18) | `content_item` por **tipo × idioma × slug** com status rascunho → revisão → alterações solicitadas/aprovado → agendado/publicado → despublicado/arquivado (trigger). Aprovar/publicar/despublicar só admin/coordenação; **autor não aprova o próprio**; editar conteúdo aprovado/publicado **volta a rascunho** (nada muda no site sem nova aprovação); capa exige consentimento confirmado. |
| Registro | `content_revision` imutável a cada mudança (snapshot); `approval_request` com solicitante, revisor, decisão, comentário e datas; `publication` = snapshot publicado (histórico completo, `unpublished_at`). |
| Projeção | view `public_publication` (só vivas, campos públicos) liberada para `anon`: **o site nunca lê tabelas internas**. `publish_content(item[, revisão])` copia a revisão aprovada (ou faz **rollback** para revisão já publicada); `unpublish_content` marca e audita. |
| Preview | token de 64 hex por item; `preview_content(token)` só via service role; rota `/{locale}/previa/{token}` `noindex` + robots `Disallow`, sem cache; inválido/arquivado ⇒ 404. |
| Markdown | `src/lib/content/markdown.ts`: subconjunto (parágrafos, ##/###, listas, citação, ênfases, código, links) com **todo HTML escapado** e links só `http(s)`/`mailto` — sem dependência; testado contra XSS. |
| Site | `/noticias` e `/noticias/[slug]` leem a projeção (sem selo: aprovado) e mantêm o staging sob quarentena no PT até ser substituído; `/eventos` e `/eventos/[slug]` só publicam o que passou pela aprovação (agenda vazia continua honesta); EN mostra só publicações EN — nunca PT como fallback. ISR (`revalidate = 300`) + `revalidatePath` ao publicar/despublicar. |
| Portal | `/portal/conteudos` (filtros situação/tipo por URL), `/novo`, `/[id]` (edição com versão, fluxo com comentário/motivo/agendamento, revisões com **Restaurar no site**, aprovações, publicações, pré-visualização, link público). Menu: Conteúdos e Arquivos para contas ativas. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **132/132** (novo `markdown.test.ts`: subconjunto, escape de HTML/atributos, allowlist de links, sem h1/h4) · `npm run test:rls` **45/45** (novo `files-publication.test.ts`: allowlist/limite/nome; visibilidade por vínculo; capa única; auditoria de consentimento/revogação; sem exclusão; rascunho invisível ao site; publicar sem aprovação falha; autor não aprova; snapshot na projeção; edição pós-publicação não altera o site e gera revisão; rollback só para revisão já publicada; despublicação com histórico/auditoria; locales independentes; capa sem consentimento bloqueada; preview só service role) · build ok · `npm run test:e2e` **250/250** (novo `publication.spec.ts`: sem publicações o hub mostra só o staging com selo; preview com token curto/desconhecido dá 404 e está bloqueado no robots; agenda vazia sem formulários).

## Decisões

1. Provedor de arquivos: **metadados agora, bytes no Drive** (17); sem credencial aprovada não há links assinados/miniaturas — a UI declara a pendência em vez de simular. Upload direto não existe (21 exige MIME/magic bytes/malware scan no servidor).
2. Markdown próprio sem HTML em vez de biblioteca + sanitizador: superfície mínima e sem dependência nova (justificativa: 18 exige sanitização e allowlist; um subconjunto escapado cumpre ambas).
3. Agendamento grava `scheduled_for` e o status `agendado`, mas a publicação efetiva continua manual (não há job/cron aprovado); a view já respeita `published_at <= now()` para quando existir.
4. Tipos além de notícia/evento (atualização de projeto, experiência, casos) entram na projeção, mas só ganham página pública quando a tela existir (a UI avisa).

## Pendências

- Credencial do Google Drive (escopo mínimo, servidor) para acesso assinado, miniaturas e verificação de revogação.
- Job de publicação agendada e provedor de e-mail para avisos de revisão.
- Migrar o staging de notícias para itens do Portal e retirar o bloco "herdadas do protótipo".
