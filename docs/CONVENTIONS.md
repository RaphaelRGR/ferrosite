# Convenções

Poucas regras, todas já seguidas pelo código. Na dúvida, imite o arquivo vizinho.

## Nomes

| O quê | Padrão | Exemplo |
|---|---|---|
| Componente React | `PascalCase.tsx`, um tema por arquivo; formulários de um domínio agrupados em `<Domínio>Forms.tsx` | `ProjectCover.tsx`, `MissionForms.tsx` |
| Módulo sem JSX (lib, helpers, constantes) | `kebab-case.ts` | `drive-connection.ts`, `content-constants.ts` |
| CSS de componente | `kebab-case.css` ao lado do componente | `projects/project-categories.css` |
| Pasta de componentes | domínio em inglês, minúsculas | `portal/projects`, `public/curriculum` |
| Rota (URL) | português, minúsculas, com hífen | `/para-empresas`, `/portal/conteudos` |
| Funções e variáveis | `camelCase`; constantes de módulo em `UPPER_SNAKE` | `publicCoverIds`, `MEDIA_WIDTHS` |
| Tipos | `PascalCase`; linhas do banco terminam em `Row` | `ProjectRow`, `ActionState` |
| Server Action | verbo + objeto | `createMission`, `transitionContent` |
| Chave de dicionário | `camelCase` aninhado por área | `dict.portal.missions.dueHelp` |
| Teste | `<assunto>.test.ts` (Vitest) ou `<assunto>.spec.ts` (Playwright) | `curriculum-graph.test.ts` |

Código e identificadores em inglês; textos de interface, comentários e docs em
português. Não renomeie arquivos de `public/` nem rotas: são URLs públicas.

## Organização de componentes

- `ui/` não conhece domínio, Supabase nem idioma: recebe textos por props.
- Componente de um domínio vai para a pasta do domínio (`public/<domínio>` ou
  `portal/<domínio>`); usado por várias páginas públicas, raiz de `public/`.
- Server Component por padrão. `"use client"` só quando há estado, efeito ou
  evento; nesse caso, mantenha o Client Component pequeno e passe dados prontos.
- Textos chegam por `dict` (fatia do dicionário) em vez de strings fixas.
- Sem componente duplicado para claro/escuro: use os tokens (`bg-surface`,
  `text-fg`...), que mudam com `data-theme`.

## Imports

- Entre pastas: alias `@/` (`@/lib/portal/authz`). Na mesma pasta: `./arquivo`.
  Não use `../`.
- Exceção: JSON da raiz em `src/content/*` (`../../content/...`), porque `@/`
  aponta para `src/`.
- Ordem: bibliotecas externas, depois `@/`, depois `./`.
- Tipos com `import type`.
- Nada de novos aliases.

## Dados e serviços

- **Leitura** do Portal: função em `lib/portal/queries/<domínio>.ts` com o cliente
  de sessão (`lib/supabase/server.ts`). **Leitura pública**: `lib/content/public.ts`
  com o cliente público, só views/funções liberadas para `anon`.
- **Escrita**: Server Action em `lib/portal/actions/<domínio>.ts` que
  1. confere sessão/papel cedo (espelho em `authz.ts`),
  2. valida o `FormData`,
  3. grava com o cliente de sessão (a RLS decide),
  4. revalida as rotas afetadas,
  5. devolve `ActionState` (`ok`, ou `error` + `field` + `values` via `fail()`).
- Regra de acesso nova começa na migration, não no TypeScript.
- Service role (`createAdminClient`) só em código de servidor e só para funções
  que exigem; nunca importe em arquivo com `"use client"`.
- Constantes e listas usadas por Client Components ficam em `*-constants.ts`
  (sem importar código de servidor).

## Hooks

Não há pasta de hooks: os poucos hooks próprios vivem no componente que os usa.
Se um hook passar a ser usado por dois componentes, crie `src/lib/hooks/<nome>.ts`
(nome `useAlgo`).

## Tipos

- Tipos do banco: `Tables<"project">`, `Enums<"global_role">` de
  `src/types/database.ts` (gerado; não editar à mão, rode `npm run db:types:local`).
- Tipo derivado fica no módulo dono e é exportado dali.
- `strict` do TypeScript sempre; evite `any` e `as never` (existem poucos casos
  documentados para colunas que o gerador não tipa).

## Estilos

- Tailwind com os utilitários dos tokens (`bg-canvas`, `bg-surface`, `text-fg`,
  `text-fg-muted`, `border-line`, `bg-action`, `text-link`...). Hex solto no
  componente exige justificativa.
- Token novo: `globals.css`, em claro e escuro, com par no
  `tests/unit/tokens-contrast.test.ts`. Token de um componente só: CSS próprio
  importado pelo componente (o Turbopack pode manter o `globals.css` antigo em cache).
- Animação respeita `prefers-reduced-motion`.
- Texto visível sem travessão "—".

## Assets

- Foto real (projeto, experiência, capa): Google Drive, cadastrada no Portal.
- Logo e ícones fixos: `public/brand/` ou SVG inline.
- Referência visual, mockup, documento de origem: `referencias_ferro/` (nunca em `public/`).
- Imagem pública sempre com `alt` (PT e EN) e crédito quando houver.

## Comentários

- Comente o **porquê**: decisão, restrição, workaround, segurança, regra de
  negócio, integração externa. Referências entre parênteses apontam o documento
  do plano (ex.: "(18)" = `18_PUBLICACAO_PORTAL_PARA_SITE.md`) ou a etapa
  (ex.: "DRIVE-002").
- Não comente o óbvio. Se o código precisa de muitos comentários, simplifique.
- JSDoc curto em funções exportadas quando o nome não basta.

## Tratamento de erros

- Server Actions não lançam para a interface: devolvem `ActionState.error`
  (`unauthenticated`, `forbidden`, `invalid`, `conflict`, `not_found`, `server`
  ou `db:<mensagem do guard>`), mostrado por `ActionFeedback`.
- Configuração ausente falha fechado (Portal 503; integração opcional devolve
  `null` e a tela mostra estado vazio).
- Logs com `logEvent` (`lib/observability/log.ts`), que redige segredos. Sem
  `console.log` solto, sem stack ou segredo em resposta HTTP.
- Rotas de API devolvem status corretos (400 entrada inválida, 404 inexistente
  ou não público, 503 sem configuração).

## Git e entregas

- Commits descritivos em português (`feat(escopo): ...`, `fix(...)`, `refactor: ...`).
- Cada entrega: testes verdes + relatório em `docs/baseline/` + adendos no plano.
- Nunca commitar `.env.local`, `secrets/` ou scripts de sessão (`/_*.mjs`).
