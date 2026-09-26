# Limpeza e reorganização (CLEAN-002)

Data: 2026-09-26 · Escopo: limpeza, organização e documentação, sem funcionalidade
nova, sem redesign, sem troca de tecnologia, sem mudança de schema. Continuação de
`docs/baseline/CLEAN-001-relatorio.md` (que já tinha removido o legado visual do
protótipo em 2026-09-15).

## Estado inicial

| Verificação | Resultado |
|---|---|
| `git status` | limpo, em `main` (b5cce8d) |
| typecheck | ✅ sem erros |
| lint (`--max-warnings 0`) | ✅ |
| unit (Vitest) | ✅ 197/197 |
| build | ✅ |
| arquivos versionados | 425 (215 em `src`) |
| dependências | 5 de produção, 14 de desenvolvimento |

O repositório já estava em bom estado: sem pastas `old/`/`backup/`, sem arquivos
"v2"/"final", sem dependências sobrando e sem segredos versionados. Nenhum erro
pré-existente.

## Problemas encontrados

1. **"content" com vários sentidos**: `content/` (dados), `src/content/` (regras
   editoriais), `src/data/` (carga dos mesmos dados), `src/lib/content/`
   (conteúdo publicado) e `src/components/content/` (selo de quarentena).
2. `src/components/portal/` com 23 arquivos soltos, sem domínio; formulários de
   arquivo escondidos dentro de `ContentForms.tsx`.
3. `src/lib/portal/` misturando consultas, regras e constantes, com
   `actions.ts` solto ao lado da pasta `actions/`.
4. Código sem uso (abaixo) e CSS de um carrossel que não existe mais.
5. Conversão de datas no fuso do curso copiada em 4 lugares.
6. Imports com `../` convivendo com o alias `@/`; 4 arquivos do protótipo com
   outro estilo (aspas simples, sem ponto e vírgula).
7. `docs/content/inventario-editorial.md` desatualizado (não refletia os 33
   itens verificados em 2026-09-25).
8. README desatualizado e ausência de mapa de pastas, arquitetura e convenções.

## Arquivos removidos

Todos sem nenhum import, referência textual ou uso dinâmico (busca em `src`,
`tests`, `scripts`, `content`, configs), confirmados por typecheck, build e testes.

| Categoria | Item | Por quê |
|---|---|---|
| Componente | `src/components/ui/AnimatedSection.tsx` | substituído pelo `MotionProvider` (UX-MOTION); nenhum uso |
| Constantes | `src/lib/constants.ts` | cores, nome e menu do protótipo (links para rotas que não existem mais, como `/visitas`); nenhum uso |
| Cliente Supabase | `src/lib/supabase/client.ts` (browser) | nenhum Client Component acessa o Supabase direto; tudo passa pelo servidor |
| CSS | `.marquee-track` e `@keyframes marquee` em `globals.css` | carrossel de logos removido antes; nenhuma classe usa |
| Asset (decisão posterior) | `public/logo-icon.png` | removido a pedido depois da revisão de `CLEANUP_PENDING.md` (sem uso no código) |
| Asset (decisão posterior) | `public/grades/fluxo{2025,2016,2012}.html` | fluxogramas HTML do protótipo, substituídos pelo fluxograma interativo; removidos a pedido (os PDFs oficiais continuam) |
| Exports órfãos | `getContentSection` (quarantine), `isAdminClientConfigured` (admin), `IndicatorId` (reports), `contentType` (rota OG) | zero usos; o `ImageResponse` já define o content-type |

## Dependências removidas

Nenhuma. As 19 estão em uso: `next`, `react`, `react-dom`, `@supabase/ssr`,
`@supabase/supabase-js` (app); `tailwindcss`, `@tailwindcss/postcss`,
`typescript`, `@types/*`, `eslint`, `eslint-config-next` (build); `vitest`,
`@playwright/test`, `@axe-core/playwright` (testes); `pg`, `@types/pg`,
`embedded-postgres` (testes de RLS e geração de tipos).

## Pastas reorganizadas

| Antes | Depois |
|---|---|
| `src/data/{curriculums,labs,capabilities}.ts` | `src/content/` (uma pasta para conteúdo estático tipado) |
| `src/data/curriculums.legacy.ts` | `content/curriculum/legacy-prototype.ts` (insumo do gerador, ao lado dos JSON; gerador reexecutado: saída idêntica) |
| `src/components/content/*` + `layout/PendingContent.tsx` | `src/components/editorial/` |
| `src/components/curriculum/*` | `src/components/public/curriculum/` |
| `components/public/{ProjectCards,ProjectCover,project-categories.css}` | `components/public/projects/` |
| `components/public/ExperienceCard.tsx` | `components/public/experiences/` |
| `components/portal/*` (23 soltos) | `portal/{shell,projects,content,files,crm,settings,people,reports}/` + `ActionFeedback` na raiz |
| `ContentForms.tsx` (conteúdo + arquivos) | `portal/content/ContentForms.tsx` + `portal/files/FileForms.tsx` |
| `lib/portal/actions.ts` | `lib/portal/actions/theme.ts` |
| `lib/portal/{content,crm,mail,missions,projects,reports}.ts` | `lib/portal/queries/` |

42 arquivos movidos com `git mv` (histórico preservado); 90 arquivos com imports
reescritos por script; nenhum re-export ou redirect temporário deixado para trás.
URLs públicas e rotas não mudaram.

## Duplicações corrigidas

- `toDateTimeLocal` (antes `toLocalInput` idêntico em `ContentForms` e
  `MissionForms`) e `institutionalDate` (antes em `reports.ts` e na página de
  missões) centralizados em `src/i18n/format.ts`, com testes.
- Imports `../` entre pastas convertidos para `@/` (11 arquivos).
- `proxy.ts`, `lib/supabase/{server,middleware}.ts` e `api/auth/callback`
  no estilo do resto do código (aspas duplas, ponto e vírgula).

Avaliadas e mantidas: os 4 clientes Supabase têm papéis distintos (sessão, proxy,
anônimo, service role); `*-tones.ts` e `*-constants.ts` são pequenos e por
domínio; o parsing `datetime-local` → ISO das Server Actions tem semântica
diferente por campo (ver `CLEANUP_PENDING.md`, item 11).

## Segurança

| Verificação | Resultado |
|---|---|
| Segredos em arquivos versionados (JWT, chaves Google/Resend, PEM, URLs com senha) | nenhum |
| Segredos no histórico do git (`-S`/`-G` por padrões de chave) | nenhum |
| `.env*` versionado | só `.env.example`, com nomes e valores vazios/exemplo |
| JSON do OAuth do Google | só em `secrets/` (ignorado) |
| Service role | só em `lib/supabase/admin.ts`, com guarda contra uso no navegador |
| `.gitignore` | acrescentados `*.log`, `__pycache__/`, `*.pyc`, `/.claude/settings.local.json` (antes só no ignore global da máquina) |
| `.env.local` | preservado |

## Documentação criada

- `AI_CONTEXT.md`: contexto para IAs (carregado pelo `CLAUDE.md`; o `AGENTS.md`
  aponta para ele).
- `docs/PROJECT_STRUCTURE.md`: árvore, o que entra e o que não entra em cada
  pasta, e "Onde coloco um novo...?".
- `docs/ARCHITECTURE.md`: site, Portal, auth, Supabase, Drive, acesso, i18n,
  temas, dados públicos x privados (com diagramas Mermaid).
- `docs/CONVENTIONS.md`: nomes, componentes, imports, serviços, tipos, estilos,
  comentários, erros.
- `docs/CLEANUP_PENDING.md`: itens incertos para decisão.
- `README.md` reescrito; `docs/content/inventario-editorial.md` regenerado;
  caminhos atualizados em `docs/GOOGLE_DRIVE_INTEGRATION.md` e no inventário.

## Itens preservados propositalmente

- `referencias_ferro/` (inclui o PDF que gera `content/labs.json`) e
  `PLANO_DESENVOLVIMENTO_CLAUDE/`: intocados.
- Fluxograma: JSON 2025/2016/2012, insumo legado do gerador e PDFs oficiais.
- `src/content/staging.ts`: texto herdado em quarentena (validação pendente).
- `docs/baseline/`: relatórios históricos não foram reescritos (citam caminhos
  antigos, como é natural num histórico).
- Rotas placeholder/legadas do Portal (`questoes`, `acervo`) e `simuladores`.
- Caminho de conta de serviço do Google (fallback do Drive).

## Itens ainda incertos

11 itens em aberto em `docs/CLEANUP_PENDING.md` (ex.: páginas placeholder, fallback de conta de serviço,
scripts locais de sessão).

## Testes executados

| Verificação | Antes | Depois |
|---|---|---|
| typecheck | ✅ | ✅ |
| lint | ✅ | ✅ |
| unit | 197/197 | 199/199 (+2 para os helpers de data) |
| RLS (Postgres embutido) | não rodado | 70/70 |
| build | ✅ | ✅ |
| e2e completo (311) | não rodado | 302 passaram; 4 falharam por timeout de navegação sob carga (`/pt/curso`, `/pt/experiencias`) e 1 passo da jornada do Portal, com 5 dependentes não executados. Rodando de novo `portal-journey` + `smoke`: **147/147** |
| Gerador curricular | não rodado | saída idêntica (só a data de extração muda; revertida) |
| Smoke visual (dev) | não rodado | 14 telas do Portal com 200 e sem erro; tema claro e escuro aplicados no servidor; 9 rotas públicas (PT/EN) em 375, 768 e 1366 px sem rolagem horizontal; fluxograma com as 3 matrizes, seleção e anúncio acessível |

## Resultado final

Mesma aplicação e mesmo comportamento, com menos código (3 arquivos e 4 exports sem uso removidos),
nenhuma duplicação de datas, pastas por domínio no Portal e no site, leituras e
mutações do Portal separadas e documentação suficiente para uma pessoa ou IA se
orientar sem redescobrir o projeto.

## Recomendações futuras

1. Decidir os itens de `docs/CLEANUP_PENDING.md`.
2. Projeto Supabase separado para testes: o e2e cria fixtures no banco real
   (ex.: projetos `projeto-e2e-*`).
3. Criar `fromDateTimeLocal` em `i18n/format.ts` quando houver testes de Server
   Action cobrindo as datas.
4. Adotar um formatador (Prettier) para evitar nova divergência de estilo.
5. Se o Portal ganhar EN, levar títulos e textos fixos das páginas para o dicionário.
