# Decisões e conflitos encontrados

## Decisões firmes

1. Preservar App Router/TS strict/Tailwind/Supabase como direção inicial; Supabase só é confirmado após schema/RLS/prova vertical.
2. Não reescrever tudo; migrar incrementalmente.
3. Separar shells antes do redesign.
4. Segurança/RLS antes de dados reais/dashboard.
5. Site claro; Portal dual-theme; logo oficial.
6. Conteúdo público é projeção aprovada.
7. Fluxograma permanece interativo e com três matrizes.
8. “Atrasada” é condição derivada; “atividade” não é “missão”; auditoria não é diário.

## Conflitos factuais/editoriais

- `AboutHistory` diz fundação em 2014; `StoryJourney` diz 04/08/2009.
- “Único no Brasil”, “único de Santa Catarina” e “primeiro no Sul” aparecem como afirmações distintas.
- CREA: “dupla atribuição”, “sem restrições” e Art. 12 precisam validação jurídica/institucional.
- Investimentos R$ 600 bi/R$ 103 bi e 30 mil km não têm fonte no repositório.
- 15+ projetos, 48 visitas, 1,2 mil alunos e três países não têm fonte.
- Empresas aparecem como parceiras e destinos de egressos na mesma faixa; relações não equivalentes.
- Notícias/eventos/visitas 2022–2026 e pessoas dos mockups não são dados confirmados.
- **BASE-002 (2026-09-14):** todos os itens acima estão inventariados em `content/editorial-inventory.json` com status UNVERIFIED e marcados no site com o selo "Conteúdo em verificação"; a tabela de conflitos consolidada está em `docs/baseline/BASE-002-relatorio.md`.

## Conflitos de escopo

- Briefing exige site público integral PT/EN; guia diz “principais áreas do Portal” também. Decidir extensão do Portal no MVP, mantendo fundação traduzível.
- `/portal/questoes` e `/simuladores` existem como placeholders, mas não aparecem na IA central. Não remover sem decisão.
- Portfólio lista LABMCI/LASC/IDA Lab sem páginas; faltam dados.
- LabDSE e Robótica compartilham texto quase idêntico no PDF; diferenciar com responsáveis.
- Aplicações LDTPav são descritas como potencial; não divulgar como ensaio oferecido sem confirmação.
- Mockups só mostram Portal claro/desktop; dark/mobile precisam projeto próprio.

## Riscos técnicos explícitos

- reduced motion deixa manifesto invisível e parte da jornada esmaecida.
- EMB5512/2012 depende de EMB5107, presente apenas nas optativas hoje não renderizadas.
- `referencias_ferro/` está fora do Git; decidir LFS/acervo/documentação.
- HTMLs legados públicos duplicam dados e usam inline handlers; remoção pode quebrar links externos.
- instalação inicialmente travou sem saída; a segunda execução passou. TypeScript e build passam, mas lint falha com 11 erros/14 avisos.
- `npm audit --omit=dev` reporta 5 vulnerabilidades de produção, incluindo Next 16.2.4 como crítica; correção indicada em 16.3.5 deve ser aplicada antes de qualquer release.
- **Atualização BASE-001 (2026-09-14):** Next atualizado para 16.3.5; audit zerado; lint zerado; reduced motion do manifesto/jornada corrigido com teste. Ver `docs/baseline/BASE-001-relatorio.md`.
- Matriz 2012: `EMB5605` (fase 6) declara pré-requisito `EMB5116` (também fase 6). HTML legado repete o dado; PDF não conferido. `[CONTEÚDO PENDENTE]` para FLOW-001; registrado como exceção conhecida no teste de invariantes.
- Matriz 2016: slots `OPT-1..OPT-4` ("Optativa Obrigatória I–IV") estão entre as obrigatórias das fases 8–9; a contagem 61 os inclui. Decidir modelagem em FLOW-001.
- **FLOW-001 (2026-09-15):** os PDFs oficiais são a fonte canônica; os slots I–IV constam no PDF de 2016 (fases 8–9). O PDF de 2012 não traz pré-requisitos: as arestas de 2012 (incl. EMB5512→EMB5107 e EMB5605→EMB5116, ambas fase 6) são legadas e aguardam a coordenação. Ver `docs/baseline/FLOW-001-002-relatorio.md`.
- **LAB-001 (2026-09-15):** Robótica Avançada tem, no PDF, corpo idêntico ao LabDSE → nada publicado além de nome/responsável até validar o diferencial. Aplicações do LDTPav são 100% prospectivas → selo "Potencial de aplicação", nunca serviço. LABMCI/LASC/IDA Lab só no índice → páginas com pendência, sem responsável inventado. Contatos do PDF nunca copiados. Texto do portfólio verbatim (typo 'characterização' e bio no LAV) registrado no inventário para decisão do owner. Ver `docs/baseline/LAB-001-relatorio.md`.
- **PORTAL-002/003 (2026-09-15):** cadeia de estados fixada no servidor (10 'sugestão inicial'), com `draft` inicial e `cancelled` terminal; concorrência por `version` (conflito devolve mensagem, nunca sobrescreve); `supabase gen types` exige Docker → gerador próprio a partir do Postgres embutido (`scripts/db-types-local.mjs`). Convite/aceite ficam no Supabase Auth; Pessoas cobre ativação/papel/desativação. Ver `docs/baseline/AUTH-003-PORTAL-002-003-relatorio.md`.
- **CRM-001 (2026-09-15):** envio público de desafio via service role no servidor (função restrita) em vez de RPC anônimo, para que o hash de origem não seja forjável; sem anexos até FILE-001; retenção dos dados `[CONTEÚDO PENDENTE]`; sem notificação por e-mail (provedor não aprovado). Ver `docs/baseline/CRM-001-relatorio.md`.
- **FILE-001/PUB-001 (2026-09-15):** Drive continua sendo o storage (só metadados no Portal; sem credencial não há link assinado/miniatura — pendência declarada na UI); Markdown restrito próprio (HTML sempre escapado, links http(s)/mailto) em vez de biblioteca; agendamento sem job (publicação manual); tipos sem página pública ficam só na projeção. Ver `docs/baseline/FILE-001-PUB-001-relatorio.md`.
- **REPORT-001 (2026-09-15):** visitas/horas/captação sem entidade-fonte devolvem `null` ('sem dados'); 'aluno' = papel global member até existir vínculo institucional; exportação CSV (PDF depende de template aprovado); geração síncrona. Ver `docs/baseline/REPORT-001-relatorio.md`.
- **OPS-001 (2026-09-15):** CSP com `script-src 'unsafe-inline'` (nonce exigiria site inteiro dinâmico) compensada por object-src/base-uri/form-action/frame-ancestors estritos; sem sink de APM até decisão; SLOs e ensaio de restore `[CONTEÚDO PENDENTE]`. Ver `docs/baseline/OPS-001-relatorio.md` e `docs/ops/runbook.md`.
- **CLEAN-001 (2026-09-15):** removidos componentes/assets do protótipo sem consumidor (incl. `hero.mp4` de 35 MB e `hero-bg.png`, sem licença/crédito registrados — recuperáveis pelo Git se houver decisão de uso); mantidos grades legadas, `curriculums.legacy.ts`, logos sob quarentena e registros do inventário; `/portal/questoes` continua como placeholder honesto até a pergunta 6 ser respondida. Ver `docs/baseline/CLEAN-001-relatorio.md`.
- **Banco na nuvem (2026-09-15):** migrations aplicadas; logout com `scope: local` (revogação global = desativar conta em Pessoas); primeiras contas admin provisionadas por script (senha do usuário definida por ele mesmo, nunca pelo assistente); `db:types` na nuvem exige Docker — usar `db:types:local`. Ver addendum em `docs/baseline/ENTREGA-FINAL.md`.

## Perguntas realmente bloqueadoras

1. Quais alegações/números/datas/parcerias são oficiais e quem aprova?
2. Qual é a fonte curricular canônica e quem valida divergências?
3. Qual política de login, papéis, domínio UFSC e acesso externo?
4. Supabase e Google Drive estão aprovados? Quais ambientes/escopos/retensão?
5. Qual conteúdo do Portal precisa PT/EN no primeiro release?
6. `Questões` e `Simuladores` continuam?
7. Quais fotos/logos têm direitos e consentimento, e onde estão os originais?
8. Quem pode aprovar publicação, P&D, financeiro e dados pessoais?

Não bloqueiam BASE-001, shells, tokens, testes ou protótipo com fixtures isoladas. Bloqueiam publicação de fatos, políticas finais e ingestão de dados reais.

## Addendum MAIL-001 (2026-09-17)

- Provedor de e-mail escolhido pelo usuário: **Resend** (API HTTP, sem SDK). Fica pendente do usuário: conta, domínio verificado do remetente institucional e as variáveis `RESEND_API_KEY`/`MAIL_FROM`/`MAIL_REPLY_TO`/`MAIL_DISPATCH_SECRET`. Até lá a fila acumula sem perda.
- O e-mail à empresa leva só protocolo e título (a descrição pode ser confidencial; e-mail não é canal seguro). Retenção de `mail_outbox` (destinatário + payload mínimo) entra na mesma decisão de retenção dos desafios (pergunta 4).
- Conexão de migração: o host direto `db.<ref>.supabase.co` resolve só em IPv6; em redes IPv4 usar o session pooler (`postgres.<ref>@aws-<n>-<região>.pooler.supabase.com:5432`).

## Addendum DRIVE-001 (2026-09-21)

- Modelo de acesso ao Drive: **conta de serviço somente leitura** sobre uma pasta institucional compartilhada; sem OAuth de usuários. Pendente do usuário (pergunta 4): projeto Google Cloud, conta de serviço, pasta e variáveis `GOOGLE_*`.
- Bytes sempre por proxy do próprio site (Portal autenticado; público só capa de publicação viva, verificada, pública e com consentimento). Nunca link do Drive, nunca URL permanente.
- Capa pública exige `classification = public` além do consentimento — duas decisões distintas da coordenação.
- Otimização/redimensionamento de imagens para o site fica para a decisão de hospedagem/CDN.

## Addendum OPS-002 (2026-09-21)

- Sink de erros implementado como **contrato de webhook genérico** (JSON + Bearer), sem SDK de provedor: a escolha do provedor (Better Stack, Axiom, coletor da UFSC…) continua institucional e não exige código novo — só `ERROR_SINK_URL`/`ERROR_SINK_TOKEN`.
- Eventos encaminhados já saem redigidos (mesma redação do log); limite de 60/min por processo evita inundação por laço de erro. Relatos do navegador são aceitos sem sessão (páginas públicas quebram sem login), por isso o contrato é rígido, sem eco, e limitado por origem hasheada.
- SLOs continuam `[CONTEÚDO PENDENTE]` (pergunta institucional).

## Addendum DRIVE-002 (2026-09-21)

- Google OAuth **só autoriza o Drive**; identidade e acesso ao Portal seguem no Supabase Auth (decisão firme, pedida pelo usuário). Quem configura: admin/coordenação, validado no servidor e no banco.
- Escopo `drive.readonly` (restrito): `drive.file` não enxerga a pasta institucional pré-existente sem Google Picker; leitura de bytes exige `readonly`. Implica app em modo Teste (usuários de teste) até verificação do Google. Sem escrita nesta fase.
- Tokens cifrados (AES-256-GCM) com `DRIVE_TOKEN_KEY` (fallback derivado da service role) em tabela sem policy para `authenticated`. Mudar a chave exige reconectar.
- O client secret não pôde ser gravado em `.env.local` pelo assistente (política de credenciais); `npm run google:env` faz isso a partir de `secrets/client_secret*.json`, que está ignorado pelo git.
- Pendências: domínio de produção (`GOOGLE_REDIRECT_URI` https), verificação do app no Google ou permanência em Teste, e a estrutura de pastas institucional (só a raiz é configurada agora).

## Addendum DRIVE-003 (2026-09-21)

- Usuário decidiu: estrutura do acervo por entidade dentro da pasta raiz (aprovada) e tipos de upload **sem antivírus** = imagens, PDF, CAD (STL/DXF/DWG/SLDPRT) e Office; **ZIP e vídeo ficam de fora** até haver varredura (só registro de link). Reavaliar quando houver provedor de antimalware.
- Escopo ampliado de `drive.readonly` para `+ drive.file`, justificado: criar subpastas e arquivos dentro da raiz; nada além do que o app cria.
- A pasta `02/Comunica Ferro/SENHAS` e `04/…/LIXEIRA` do Drive humano **não** devem ser copiadas para a raiz do Portal (credenciais não são acervo; o Portal serve bytes a quem tem acesso).
- Levantamento do Drive (só leitura): 87 pastas / 513 arquivos até 3 níveis (292 JPEG, 147 STL, 22 ZIP, 10 PDF, 9 MP4…). Migração para o acervo é por cópia item a item pelo Portal, com metadados (crédito, consentimento, classificação).
