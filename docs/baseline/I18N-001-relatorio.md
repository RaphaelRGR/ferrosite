# I18N-001 — Fundação PT/EN

Data: 2026-09-14 · Depende de ARCH-001 e DS-001

## Decisões

1. **Locale explícito e prefixado** (`/pt/...`, `/en/...`), como sugerem `03` e `24`. URLs antigas (`/`, `/curso`, …) redirecionam com **307** para o locale escolhido: cookie `locale` (gravado pelo seletor) → `Accept-Language` → `pt`. Não é 308 porque o destino depende da preferência do visitante; canonical/hreflang cuidam do SEO.
2. **Portal, catálogo e API ficam sem prefixo.** O escopo PT/EN do Portal é decisão pendente (`33`); a fundação (catálogos tipados, `Intl`) já serve ao Portal, mas seu `lang` fica `pt-BR` e suas strings continuam hard-coded até a decisão.
3. **Conteúdo editorial em EN não foi traduzido.** As 11 seções da Home e as demais páginas estão em quarentena (BASE-002) e contêm alegações sem fonte; traduzi-las propagaria conteúdo não verificado. `24` proíbe PT como fallback invisível em página EN, então em `/en`: Navbar, rodapé, skip link, hero, CTA, metadata, 404/erro vêm do catálogo EN; as seções editoriais mostram **"Content in preparation"** e `/en/curso|sobre|visitas|eventos|noticias|simuladores` mostram **"Page in preparation"** com link para a versão PT. "Nenhuma mistura" está atendido; "100% do conteúdo" depende de BASE-002/PUBLIC-001.
4. **Nomes oficiais não traduzidos** (Comunica Ferro, Cavalos de Ferro, Ferro Lab, UFSC Joinville). "Curso" → "Program"; "Visitas" → "Field Visits".
5. `middleware.ts` → **`proxy.ts`** (convenção do Next 16; o aviso de depreciação some). Comportamento de `updateSession` preservado; o guard de AUTH-002 entra ali.

## Estrutura

| Arquivo | Papel |
|---|---|
| `src/i18n/config.ts` | `LOCALES`, `DEFAULT_LOCALE`, `LOCALE_TAGS` (pt-BR/en), `hasLocale`, `splitLocale`, `localizePath`, `negotiateLocale` |
| `src/i18n/dictionaries/pt.ts` | catálogo PT e o tipo `Dictionary` (chaves obrigatórias) |
| `src/i18n/dictionaries/en.ts` | catálogo EN — o TypeScript obriga cobertura de todas as chaves |
| `src/i18n/format.ts` | `formatDate`/`formatNumber`/`formatList` via `Intl`, fuso institucional `America/Sao_Paulo` |
| `src/i18n/metadata.ts` | `SITE_URL` (`NEXT_PUBLIC_SITE_URL`, **[CONTEÚDO PENDENTE]** em produção), `localeAlternates` (canonical + hreflang pt-BR/en/x-default), `publicPageMetadata` (OG localizado) |
| `src/proxy.ts` | redirect de locale + sessão Supabase |
| `src/components/layout/HtmlShell.tsx` | `<html lang data-theme>` + fonte + globals, compartilhado pelos 3 root layouts |
| `src/app/(public)/[locale]/layout.tsx` | root layout público: `generateStaticParams` pt/en, `lang` real, `metadataBase`, `title.template` |
| `src/app/(public)/[locale]/{page,HomeContent}.tsx` | Home: server page (metadata/gate) + conteúdo client |
| `src/app/(public)/[locale]/*/page.tsx` | `generateMetadata` por locale; EN → `PendingPage` |
| `src/app/(public)/[locale]/[...rest]/page.tsx` + `not-found.tsx` | 404 localizada dentro do shell (status 404 real) |
| `src/components/layout/LocaleSwitcher.tsx` | PT/EN na Navbar (desktop e mobile): preserva rota/query/hash, `hreflang`, `aria-current`, grava cookie |
| `src/components/layout/PendingContent.tsx` | `PendingPage`/`PendingSection` |
| `src/app/sitemap.ts`, `robots.ts` | sitemap por locale com alternates; `Disallow` de Portal/API/catálogo |

`HeroSection`, `CtaSection`, `Navbar`, `PublicShell`, `error.tsx` e `not-found` recebem o catálogo por props/params; `app/layout.tsx` e `app/not-found.tsx` da raiz deixaram de existir (três root layouts: público por locale, Portal, catálogo — navegação entre eles é full page load, o que é adequado).

## Validação

- `npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **70/70** (+7: paridade de chaves PT/EN, sem strings vazias, sem PT residual em EN salvo nomes próprios, `splitLocale`/`localizePath`, negociação de `Accept-Language`, `Intl` por locale) · `npm run build` 25 páginas (14 públicas pré-renderizadas em pt/en).
- `npm run test:e2e` **94/94**, incluindo `i18n.spec.ts`: 307 de `/` e `/curso` por header e por cookie; Portal/catálogo/PDF sem prefixo; `lang`, canonical e hreflang nas 7 rotas × 2 locales; `/en` sem strings PT (nav, rodapé, hero, CTA) e editorial marcado como pendente; `/en/curso` com aviso e link `/pt/curso`; 404 localizada com status 404; seletor preserva rota, grava cookie e volta; sitemap/robots.
- Visual: `/en` desktop e menu mobile com seletor e rótulos EN.

## Achados

1. **`loading.tsx` transformava 404 em 200.** Com o boundary de Suspense do `loading.tsx` em `[locale]`, o `notFound()` do catch-all era lançado depois do início do streaming e o status saía 200 (comportamento documentado). Removido o `loading.tsx` público (páginas estáticas, nunca aparecia); o do Portal permanece.
2. `/portal/<inexistente>` cai no 404 padrão do Next (sem shell nem tradução) porque há múltiplos root layouts; a solução oficial (`global-not-found`) é experimental. Fica para PORTAL-001 (catch-all no Portal, como no site).
3. `title` das páginas trocou o sufixo "| FerroSite" (nome do repositório, não institucional) pelo template `%s · Engenharia Ferroviária e Metroviária — UFSC Joinville`. Descrições PT mantidas verbatim (quarentena em BASE-002).
4. Chave `hero.scrollHint` existe nos catálogos mas o indicador de scroll é só visual; fica para uso futuro ou remoção.
5. Screenshots de baseline passam a cobrir 19 rotas × 4 viewports (regenerar com `npm run baseline:screenshots`).

## Pendências relacionadas

- `NEXT_PUBLIC_SITE_URL` de produção (canonical/sitemap absolutos) — **[CONTEÚDO PENDENTE]**.
- Conteúdo editorial EN por página/seção → BASE-002 (quarentena) e PUBLIC-001/002 (conteúdo validado por locale, `slug_pt/slug_en`).
- Escopo PT/EN do Portal e `lang` dinâmico do Portal → decisão (`33`) + PORTAL-001.
- Pseudo-locale para clipping e testes de expansão de texto (`24`) → quando houver formulários/tabelas reais.
