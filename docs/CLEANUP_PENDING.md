# Limpeza: itens para decisão

Itens que parecem legado ou dispensáveis, mas cuja remoção **não foi provada
segura** ou depende de decisão do curso. Nada aqui foi apagado. Levantado na
limpeza de 2026-09-26 (`docs/CLEANUP_REPORT.md`).

| # | Item | Por que parece legado | Por que não foi removido | O que confirmar |
|---|---|---|---|---|
| 1 | `public/logo-icon.png` | nenhum código referencia desde o site novo; o favicon é `src/app/favicon.ico` e o logo é `public/brand/efm-logo-lockup.png` | é uma URL pública (pode estar linkada fora do site) e é um ativo de marca | apagar, ou mover para `referencias_ferro/` como arquivo de identidade |
| 2 | `public/grades/fluxo2025.html`, `fluxo2016.html`, `fluxo2012.html` | o fluxograma interativo da página Curso substitui esses HTML do protótipo; nenhum link do site aponta para eles | registrados como "fallback documental" desde a auditoria (BASE-001) e testados em `tests/helpers/routes.ts`; podem ter links externos | se o curso não divulga esses endereços, remover os 3 arquivos e a entrada em `GRADE_ASSETS` |
| 3 | `/portal/questoes` | placeholder do protótipo, fora do menu | decisão pendente (33, pergunta 6) | o módulo "Questões" continua? Se não, remover a página e a rota em `tests/helpers/routes.ts` |
| 4 | `/portal/acervo` | só redireciona para `/portal/arquivos` | preserva links antigos do protótipo (28) | se ninguém usa o endereço antigo, remover |
| 5 | `/[locale]/simuladores` | página sem produto definido, não indexada | decisão pendente (33) | existe plano de simuladores? Se não, remover a página e a entrada do dicionário |
| 6 | Conta de serviço do Google (`GOOGLE_SERVICE_ACCOUNT_*`, `createServiceAccountTokenSource`/`buildAssertion` em `src/lib/files/drive.ts`) | a conexão real é por OAuth (DRIVE-002); a conta de serviço é o caminho antigo (DRIVE-001) | ainda é fallback suportado e testado (`tests/unit/drive.test.ts`); remover muda a política de integração | o fallback somente leitura ainda é desejado? |
| 7 | `(catalog)/design-system` | ferramenta de desenvolvimento publicada em produção (noindex, fora do menu) | usada pelo axe e pelos testes de diálogo; útil para revisar componentes | manter em produção ou servir só fora de `VERCEL_ENV=production` |
| 8 | `tests/integration/rls.test.ts` | parte dos cenários também existe em `tests/rls` (Postgres embutido) | é o único teste contra o Supabase real; pula sem variáveis | manter (recomendado junto de um projeto Supabase de testes) ou remover |
| 9 | Scripts de sessão na raiz: `_dbq.mjs`, `_import-visits.mjs`, `_projects.mjs`, `_publish-experiences.mjs`, `_purge-e2e.mjs` | usos pontuais (importar visitas, cadastrar projetos, limpar fixtures do e2e); ignorados pelo git | são arquivos locais seus e registram como os dados foram carregados | apagar quando não precisar mais repetir essas cargas |
| 10 | Títulos das páginas do Portal fixos em PT (`export const metadata = { title: "..." }`) e `getDictionary("pt")` no Portal | contornam o sistema de i18n | o Portal é PT por decisão ainda aberta (33, pergunta 5) | se o Portal ganhar EN, mover títulos para o dicionário |
| 11 | Conversão `datetime-local` → ISO nas Server Actions (`-03:00` em `actions/content.ts`, `crm.ts`, `missions.ts`, `projects.ts`) | pequena duplicação (cada campo tem semântica própria: início do dia, fim do dia, hora exata) | centralizar muda o parsing de datas gravadas; fora do escopo de limpeza sem mudar comportamento | criar helper `fromDateTimeLocal` em `i18n/format.ts` numa etapa com testes de ação |
| 12 | Blocos em quarentena (`src/content/staging.ts`: indicadores, notícias, parceiros, história, identidade, pilares) | em produção não aparecem | são o texto herdado que a coordenação ainda vai validar ou descartar | validar item a item em `content/editorial-inventory.json` |
| 13 | `docs/baseline/` (nome) | a pasta guarda relatórios de etapa, não só "baseline" | dezenas de referências no plano e nos relatórios apontam para esse caminho | manter o nome (recomendado) |
