# Backlog para Claude Code

Convenção: P0 bloqueia dados reais/produção; P1 bloqueia release; P2 evolução. Todos os itens preservam mudanças do usuário e usam `[CONTEÚDO PENDENTE]` quando faltar fato.

## BASE-001 — baseline reproduzível (P0)

- **Objetivo/contexto:** provar o estado do protótipo; instalação atual não concluiu de forma confiável.
- **Dependências/arquivos prováveis:** nenhuma; `package.json`, lock, configs, CI, testes.
- **Fazer:** fixar Node suportado; atualizar Next 16.2.4/transitivas até `npm audit --omit=dev` não reportar advisories aplicáveis (o audit atual sugere 16.3.5); instalar; criar typecheck/test/e2e; zerar erros de lint; rodar build, smoke, links, screenshots e invariantes das grades.
- **Preservar/não fazer:** preservar visual/dados; não redesenhar nem “corrigir” currículo por suposição.
- **Aceite/teste:** pipeline local/CI verde e relatório de baseline; audit de produção sem vulnerabilidade crítica/alta aplicável; cada rota retorna esperado; links órfãos listados.
- **Impactos:** viewports baseline; PT/EN e tema apenas inventariados; segurança sem dados reais.

## BASE-002 — quarentena editorial (P0)

- **Objetivo/contexto:** impedir fatos não comprovados; arrays atuais misturam exemplo e afirmação.
- **Dependências/arquivos:** BASE-001; `src/components/sections/*`, catálogo/staging novo.
- **Fazer:** inventário com fonte/owner/status; ocultar ou marcar conteúdo não verificado em produção.
- **Preservar/não fazer:** preservar texto como evidência; não importar mockup como seed.
- **Aceite/teste:** nenhuma métrica/notícia/parceria/data pública sem `verified_at`/fonte; revisão manual.
- **Impactos:** copy móvel; campos PT/EN; ambos os temas onde exibido; reduz risco reputacional/privacidade.

## ARCH-001 — separar shells (P0)

- **Objetivo/contexto:** Portal herda Navbar/footer e `<main>` públicos.
- **Dependências/arquivos:** BASE-001; `src/app/layout.tsx`, route groups/layouts.
- **Fazer:** root mínimo, public shell claro, Portal shell próprio; exatamente um main/skip link.
- **Preservar/não fazer:** URLs e conteúdo; não iniciar dashboard.
- **Aceite/teste:** smoke e landmarks; Portal sem shell público.
- **Impactos:** todos viewports; locale no shell público; tema isolado; gate de auth preparado.

## DS-001 — tokens e componentes (P1)

- **Objetivo/contexto:** remover hardcoding repetido e criar base dual-theme.
- **Dependências/arquivos:** ARCH-001; globals, `components/ui`, catálogo.
- **Fazer:** tokens semânticos, controles/estados acessíveis, logo oficial.
- **Preservar/não fazer:** laranja/identidade; não criar framework excessivo.
- **Aceite/teste:** catálogo visual nos temas/estados, axe e contraste.
- **Impactos:** reflow 320–1920; labels traduzíveis; claro/escuro nativos; foco seguro.

## I18N-001 — fundação PT/EN (P1)

- **Objetivo/contexto:** hoje `lang=pt-BR` e strings hard-coded.
- **Dependências/arquivos:** ARCH-001; routing, dictionaries, metadata.
- **Fazer:** locale routing, catálogos tipados, alternates, formatação Intl, seletor que preserva contexto.
- **Preservar/não fazer:** URLs com redirects; não usar tradução automática em produção.
- **Aceite/teste:** Home piloto 100% PT/EN, nenhuma mistura, metadata/hreflang.
- **Impactos:** clipping móvel; principal objetivo; tema neutro; sem novo risco de auth.

## AUTH-001 — schema e migrations (P0)

- **Objetivo/contexto:** tipos/banco são placeholders.
- **Dependências/arquivos:** workshop de `20/21`; `supabase/migrations`, tipos gerados.
- **Fazer:** modelo mínimo profile/role/membership/project/mission/audit, constraints, RLS.
- **Preservar/não fazer:** factories SSR; não depender de schema remoto não versionado.
- **Aceite/teste:** banco reproduzível; nenhuma tabela privada sem RLS; tipos gerados.
- **Impactos:** sem UI; chaves de status traduzíveis; tema N/A; segurança máxima.

## AUTH-002 — login/sessão/callback (P0)

- **Objetivo/contexto:** callback stub e Portal aberto.
- **Dependências/arquivos:** AUTH-001; middleware/proxy, callback, login, layout Portal.
- **Fazer:** login/logout/callback, redirect allowlist, fail-closed, desativação.
- **Preservar/não fazer:** SSR cookie refresh; nunca expor service key.
- **Aceite/teste:** anônimo bloqueado; código inválido falha; sessão renova/revoga; open redirect falha.
- **Impactos:** login responsivo; mensagens traduzíveis; temas; testes de sessão/CSRF.

## AUTH-003 — papéis e isolamento (P0)

- **Objetivo/contexto:** menor privilégio global+projeto.
- **Dependências/arquivos:** AUTH-001/002; policies, service functions, tests.
- **Fazer:** matriz, membership, grants externos/expiração, guards server-side.
- **Preservar/não fazer:** acesso administrativo necessário; não confiar em UI.
- **Aceite/teste:** matriz positiva/negativa e cross-project no CI.
- **Impactos:** UI oculta e rotas bloqueadas; rótulos i18n; tema N/A; auditoria de mudanças.

## PORTAL-001 — shell e preferências (P1)

- **Objetivo/contexto:** criar navegação operacional sem dados fictícios.
- **Dependências/arquivos:** ARCH/DS/AUTH; `(portal)`, sidebar/header/preferences.
- **Fazer:** sidebar, busca placeholder honesto/feature flag, tema, perfil, navegação por permissão.
- **Preservar/não fazer:** rota `/portal`; não copiar métricas do mockup.
- **Aceite/teste:** um main, teclado/mobile, tema persiste sem flash entre rotas.
- **Impactos:** rail/drawer; labels traduzíveis; claro/escuro; apenas itens autorizados.

## PORTAL-002 — Projeto + equipe (P1)

- **Objetivo/contexto:** primeira entidade útil.
- **Dependências/arquivos:** AUTH-003; feature projects/repositories/routes.
- **Fazer:** CRUD autorizado, membership, módulos, busca/filtro/paginação, arquivar.
- **Preservar/não fazer:** memória; não hard-delete padrão.
- **Aceite/teste:** A/B isolation, concorrência, archive/reactivate, estados.
- **Impactos:** cards/tabela móvel; campos PT/EN públicos; temas; RLS/audit.

## PORTAL-003 — Missões/atividades (P1)

- **Objetivo/contexto:** validar operação vertical.
- **Dependências/arquivos:** PORTAL-002; missions/activity/calendar.
- **Fazer:** status/transições, assignees, checklist, comentário, lista/Kanban/calendário.
- **Preservar/não fazer:** atividade separada; drag não exclusivo.
- **Aceite/teste:** transição válida, atraso derivado, concorrência, views sincronizadas.
- **Impactos:** uma coluna/agenda no mobile; rótulos i18n; temas completos; autorização por projeto.

## FLOW-001 — fonte canônica curricular (P1)

- **Objetivo/contexto:** duplicação TS/HTML/PDF e optativa externa.
- **Dependências/arquivos:** BASE-001; `curriculums.ts`, testes, import/validator.
- **Fazer:** schemas, invariantes, ciclos, optativas, fonte/versionamento.
- **Preservar/não fazer:** todas matrizes; não alterar disciplina sem validação.
- **Aceite/teste:** IDs/arestas/cargas/fases/paridade; caso EMB5107/2012 resolvido explicitamente.
- **Impactos:** N/A visual; nomes traduzíveis com critério; tema planejado; integridade.

## FLOW-002 — visualização responsiva/acessível (P1)

- **Objetivo/contexto:** manter grafo, eliminar scroll cego/hover-only.
- **Dependências/arquivos:** FLOW-001/DS; feature curriculum.
- **Fazer:** seleção persistente, ancestrais/dependentes, touch/teclado, zoom/pan/fase/fullscreen, dialog/painel.
- **Preservar/não fazer:** interatividade/3 anos; não virar apenas lista.
- **Aceite/teste:** critérios de `09` em 320 px–desktop, resize e reduced motion.
- **Impactos:** central; PT/EN da UI; contraste por fundo; sem dado sensível.

## PUBLIC-001 — Home/Curso (P1)

- **Objetivo/contexto:** primeira migração pública clara.
- **Dependências/arquivos:** DS/I18N/FLOW, conteúdo e imagens validados.
- **Fazer:** layouts editoriais, logo, SEO, hero otimizado, fluxo integrado.
- **Preservar/não fazer:** rotas/conteúdo confirmado; não baixar MP4 pesado em mobile.
- **Aceite/teste:** PT/EN, CWV/axe/links, sem fake data, screenshots.
- **Impactos:** mobile-first; integral PT/EN; site claro; sanitização/publicação futura.

## PUBLIC-002 — Projetos/Experiências/Notícias (P1)

- **Objetivo/contexto:** substituir ações falsas por hubs/detalhes reais.
- **Dependências/arquivos:** PUBLIC-001, content model.
- **Fazer:** filtros URL, paginação, detalhes, galerias, eventos e formulários reais ou ocultos.
- **Preservar/não fazer:** materiais existentes em staging; não expor participantes/arquivos.
- **Aceite/teste:** nenhuma affordance falsa; empty/error; SEO e PT/EN.
- **Impactos:** listas/mobile; conteúdo por locale; site claro; projeções públicas apenas.

## LAB-001 — capacidades/labs/Para Empresas (P1)

- **Objetivo/contexto:** transformar PDF em oferta validada.
- **Dependências/arquivos:** modelo P&D, conteúdo/fotos aprovados.
- **Fazer:** taxonomia, hubs/detalhes, relacionamento e CTA.
- **Preservar/não fazer:** nomes/capacidades comprovados; não prometer potencial como serviço.
- **Aceite/teste:** 11 labs detalhados; 3 pendentes não inventados; filtro capacidade correto.
- **Impactos:** cards/listas responsivos; PT/EN revisado; claro; contatos/PII controlados.

## CRM-001 — organizações/desafios (P1)

- **Objetivo/contexto:** receber e acompanhar demanda empresarial.
- **Dependências/arquivos:** AUTH/PORTAL/LAB; CRM, form público.
- **Fazer:** organização/contato/interação/pipeline/desafio, protocolo e triagem.
- **Preservar/não fazer:** logos validados; não tornar desafio público.
- **Aceite/teste:** submissão chega restrita, rate-limited e auditada; follow-up persiste.
- **Impactos:** form mobile; mensagens PT/EN; Portal temas; PII/confidencialidade.

## FILE-001 — Drive/galeria (P1)

- **Objetivo/contexto:** camada segura sobre acervo.
- **Dependências/arquivos:** decisão de provedor/credenciais; file model/jobs.
- **Fazer:** metadata, linking, thumbnails, signed access, consent/publication request.
- **Preservar/não fazer:** Drive como storage; não guardar URL pública permanente.
- **Aceite/teste:** revoke, malware/type/size, pagination, link expiry, 1k imagens.
- **Impactos:** upload móvel; metadata PT/EN; viewers em temas; autorização dupla.

## PUB-001 — aprovação/publicação (P1)

- **Objetivo/contexto:** cumprir Portal produz/site comunica.
- **Dependências/arquivos:** content/revisions/approvals/projection.
- **Fazer:** draft/review/approve/publish/unpublish, preview, snapshot/cache invalidation.
- **Preservar/não fazer:** histórico; não expor tabelas internas.
- **Aceite/teste:** rascunho inacessível, rollback, locale independente, corrida segura.
- **Impactos:** review mobile; PT/EN central; temas; autorização/auditoria.

## REPORT-001 — indicadores/relatórios (P2)

- **Objetivo/contexto:** gerar evidência de dados canônicos.
- **Dependências/arquivos:** módulos alimentadores e dicionário aprovado.
- **Fazer:** formulas, filtros, jobs, snapshots, exportações.
- **Preservar/não fazer:** histórico; não mostrar zero/fato sem fonte.
- **Aceite/teste:** tela/export iguais, permissões, sem dados, carga e snapshot.
- **Impactos:** gráficos/tabelas mobile; labels PT/EN; temas; export restrito/auditado.

## OPS-001 — observabilidade e hardening (P1)

- **Objetivo/contexto:** preparar operação/auditoria final.
- **Dependências/arquivos:** todas as fatias; logs, monitoring, headers, runbooks.
- **Fazer:** erros estruturados, métricas, alertas, CSP, rate limits, backup/restore e runbooks.
- **Preservar/não fazer:** privacidade; não logar tokens/payload sensível.
- **Aceite/teste:** simulações de falha/restore/incidente; SLOs aprovados.
- **Impactos:** mensagens responsivas/PT/EN/temas; segurança transversal.

## CLEAN-001 — remoção controlada do legado (P2)

- **Objetivo/contexto:** eliminar mortos/duplicação após paridade.
- **Dependências/arquivos:** migração concluída e relatório de uso.
- **Fazer:** remover imports/componentes/assets/.gitkeep e HTML duplicado, atualizar README.
- **Preservar/não fazer:** redirects/PDF/fallback necessários; não apagar referência sem confirmação.
- **Aceite/teste:** rg/dependency graph limpos, build/test, links externos considerados.
- **Impactos:** sem regressão responsiva/PT/EN/tema; reduzir superfície de ataque.
