# DRIVE-003 — upload pelo Portal para o Drive institucional

Data: 2026-09-21 · Pedido do usuário ("usar o Drive como acervo organizado"); estrutura e tipos aprovados por ele. Docs 17, 21. Base: DRIVE-002.

## Entregue

| Área | Implementação |
|---|---|
| Escopo | `drive.readonly` + **`drive.file`** (escrita só no que o próprio app cria — subpastas e uploads dentro da raiz). Reconexão feita pelo usuário; a UI mostra "Escrita habilitada" e, sem ela, oferece *Reconectar para habilitar envio*; upload responde 409 `no_write_scope`. |
| Estrutura (aprovada) | Dentro de `FERROSITE - (NÃO MEXER!)`: `projetos/<slug>/{galeria,documentos,tecnico,missoes/<id-curto>}`, `conteudos/`, `visitas/<periodo>`, `relatorios/<ano>`, `comunicacao/`, `acervo-historico/`. Criada **sob demanda**; o Portal nunca move, renomeia ou apaga. Caminho lógico → id do Drive em `drive_folder` (só service role), que também funciona como **trava**: dois uploads simultâneos criam uma única pasta (bug real encontrado no e2e paralelo e corrigido, com teste de concorrência). |
| Tipos | `file_type_allowlist.uploadable` + `extension`: imagens, PDF, CAD (STL 100 MB, DXF 50 MB, DWG 100 MB, SLDPRT 200 MB) e Office (docx/xlsx 50 MB, pptx 100 MB). **ZIP e vídeo ficam fora** até haver varredura antimalware (decisão do usuário, registrada em 33). |
| Validação | `sniff.ts`: tipo provado por **magic bytes** (JPEG/PNG/WebP/PDF/DWG/DXF/STL ascii e binário com contagem coerente/CFB para SolidWorks/OOXML lendo as entradas locais do ZIP: `[Content_Types].xml` + raiz `word/`/`xl/`/`ppt/`); executável renomeado, script, HTML, ZIP genérico e MP4 ⇒ recusados; extensão precisa ser coerente com o tipo detectado; tamanho pela allowlist; nome seguro `AAAA-MM-DD nome.ext`. |
| Pipeline (`upload.ts`) | sessão ativa → permissão do destino (projeto: papel de escrita pelo RLS, viewer não; missão: pertence ao projeto; áreas institucionais: admin/coordenação) → sniff/extensão/allowlist → `ensureFolderPath` → upload resumível (sessão + PUT) → `file_asset` **já verificado** (id/md5/tamanho do Drive, `storage_path`, `drive_folder_id`) → vínculo (`project_file` gallery/official_document/attachment ou `mission_file`). Trigger audita `file.uploaded` (quem/quando/caminho/hash). Falha de registro após o upload é logada (`file.upload_orphan`) com o id do Drive. |
| Rotas/UI | `POST /portal/arquivos/upload` (multipart, teto 200 MB, JSON só com id/caminho/nome); página `/portal/arquivos/enviar` (arquivo, destino projeto/área, pasta, classificação, consentimento, crédito, alt; progresso por XHR; erros por código); botões em Arquivos e na aba Arquivos do projeto (`?projeto=`); `?missao=` anexa a uma missão. |
| Banco | Migration 10: allowlist ampliada, `file_asset.storage_path/drive_folder_id`, `drive_folder`, trigger `audit_file_upload`. Aplicada na nuvem. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **177/177** (novo `sniff.test.ts`: todos os tipos pelos bytes, recusas, nome seguro, caminhos, `ensureFolderPath` reaproveitando/criando, **concorrência** cria uma pasta só; `drive.test.ts`: findChildFolder/createFolder/upload resumível; `google-oauth.test.ts`: escopo duplo) · `npm run test:rls` **64/64** (novo `drive-upload.test.ts`: `uploadable` por tipo, vídeo/ZIP fora, allowlist não editável por UI, `drive_folder` só service role com caminho validado, `file.uploaded` auditado com `verified_by`, registro manual não audita) · build 84 páginas + 2 rotas · e2e `drive-upload.spec.ts` **5/5 contra o Drive real**: anônimo → login; tipo forjado/extensão/destino/classificação → 415/415/400/400/404; membro sem projeto → aviso + 403; **upload real de PNG** → 201, `projetos/<slug>/galeria`, md5 do Drive, proxy devolve os mesmos bytes, vínculo ao projeto; formulário no navegador → `projetos/<slug>/documentos`. `drive-integration.spec.ts` 3/3 (agora adaptado ao estado real, sem desconectar). Suíte completa **271/271** (jornada ajustada: com o Drive conectado a página do arquivo mostra o bloco de verificação em vez da pendência).

Arquivos de teste criados no Drive real: `FERROSITE - (NÃO MEXER!)/projetos/projeto-e2e-mubcb5pk/{galeria,documentos}/2026-09-21 *.png` (mais uma pasta `projeto-e2e-mubcb5pk` duplicada da rodada em que o bug de concorrência apareceu — o Portal não apaga; remover à mão se quiser).

## Decisões

1. Upload **pelo servidor** (navegador → Portal → Drive): o token nunca vai ao browser, a validação por bytes acontece antes de qualquer byte chegar ao Google e o RLS decide o destino. Custo: o servidor bufferiza o arquivo (teto 200 MB); upload direto do navegador com sessão resumível fica para quando houver arquivos maiores.
2. Sem antimalware não entra ZIP/vídeo; CAD e Office entram porque são formatos de dados validados por estrutura (não por extensão). Registrado em 33.
3. `drive.file` em vez de `drive`: o app só enxerga/escreve o que criou; a leitura do resto continua pelo `readonly`. Verificação do Google segue pendente (app em Teste).
4. O e2e de integração **nunca desconecta** a conexão real (a versão anterior fazia isso para forçar estado e derrubou a conexão durante a rodada; corrigido).
