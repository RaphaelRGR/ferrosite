# PERF-002: desempenho do site e do Portal

Data: 2026-10-09 · Pedido: "o site e o portal estão lentos, principalmente o portal; quando clico em algo tem um delay muito grande".

## Diagnóstico (medido em produção antes da mudança)

| Sintoma | Causa | Evidência |
|---|---|---|
| Toda página do Portal demorava | As funções da Vercel rodavam em **iad1 (Washington, EUA)**, mas o Supabase fica em **sa-east-1 (São Paulo)**. Cada consulta ao banco cruzava o continente (~130 ms de ida e volta), e uma página do Portal faz de 4 a 6 consultas encadeadas: sessão → perfil → item → bloco paralelo. | `X-Vercel-Id: gru1::iad1::…` em todas as respostas dinâmicas; pooler `aws-1-sa-east-1` |
| Clique sem reação no Portal | Só havia um `loading.tsx`, no topo (`(portal)`). Entre páginas irmãs (ex.: Ações → Projetos) esse segmento não muda, então o Next mantinha a página antiga na tela, sem sinal, até a nova chegar inteira. | docs do Next 16 (`loading.md`, `layout.md` → "Interaction with loading.js") |
| Login conferido duas vezes por clique, pela rede | Proxy e layout chamavam `auth.getUser()`, que vai ao servidor de auth a cada request. O projeto assina os tokens com **ES256**, então dá para verificar localmente. | JWKS do projeto: `alg: ES256` |
| Fotos do site: 1,7 a 2,6 s cada | `/api/midia` respondia `public, max-age=300` sem `s-maxage`: a CDN da Vercel não guardava a foto e toda visita baixava de novo do Drive, passando por iad1. | `X-Vercel-Cache: MISS` repetido |
| Site público pagava a sessão | O proxy rodava `getUser` em **todas** as rotas, inclusive páginas públicas e cada foto. Para quem está logado, isso também anexava `Set-Cookie`, o que impede cache de CDN. | `src/proxy.ts` |

## O que mudou

| Mudança | Onde |
|---|---|
| Funções na região **gru1 (São Paulo)**, ao lado do banco | `vercel.json` (`"regions": ["gru1"]`) |
| `getClaims()` no lugar de `getUser()`: assinatura do JWT verificada no próprio servidor (JWKS em cache no processo); só vai à rede para renovar o token. Conta desativada continua barrada na hora pelo `profile.status`, e a RLS valida o mesmo token em toda consulta. | `src/lib/auth/session.ts`, `src/lib/supabase/middleware.ts`, `src/lib/portal/actions/theme.ts` |
| Proxy só toca na sessão em `/portal`, `/login` e `/api/auth/*` | `src/proxy.ts` (`needsSession`) |
| Fotos em cache na CDN: `s-maxage=300, stale-while-revalidate=3600`. Despublicar ou revogar continua valendo em minutos; erro do Drive segue sem cache. | `src/app/api/midia/[id]/route.ts` |
| Esqueleto de carregamento em cada pasta do Portal com subpáginas (11 fronteiras novas): o clique responde na hora e o Next pré-carrega o esqueleto junto com o link. | `src/app/(portal)/portal/**/loading.tsx`, `src/components/portal/shell/PageSkeleton.tsx` |

`getCurrentSession()` agora devolve `user: { id, email }` (tipo `SessionUser`) em vez do `User` completo do Supabase. Os chamadores só usavam esses dois campos.

## Validação

- `npm run typecheck`, `npm test` (233), `npm run build`, eslint dos arquivos alterados e `npm run test:e2e` completo.
- Produção: comparação de TTFB e `X-Vercel-Id` antes e depois (ver a mensagem do commit/entrega).

## Pendências

- Nenhuma ação do usuário é necessária: a região vem do `vercel.json`. Se o projeto na Vercel tiver uma região fixada no painel (Settings → Functions), o arquivo prevalece no deploy.
- `/pt/experiencias` continua dinâmica (filtros por `searchParams`), mas agora com o banco a poucos milissegundos.
