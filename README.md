This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Scripts de qualidade (baseline BASE-001)

Node `>=20.9` (ver `.nvmrc`). Instale com `npm ci`.

| Comando | O que faz |
|---|---|
| `npm run lint` | ESLint com `--max-warnings 0` (avisos bloqueiam) |
| `npm run typecheck` | `next typegen && tsc --noEmit` (regenera os tipos de rota antes) |
| `npm test` | Vitest — invariantes das matrizes 2025/2016/2012 |
| `npm run build` | build de produção |
| `npm run test:e2e` | Playwright — smoke das rotas, links internos e reduced motion (exige `npm run build` antes; sobe `next start` na porta 3100) |
| `npm run baseline:screenshots` | captura screenshots em `docs/baseline/screenshots/` nos 4 viewports de referência |
| `npm run check` | lint → typecheck → test → build → test:e2e |
| `npm run content:report` | regenera `docs/content/inventario-editorial.md` a partir de `content/editorial-inventory.json` |

Primeira execução do Playwright: `npx playwright install chromium`.

Relatórios por tarefa em `docs/baseline/` (BASE-001, ARCH-001, DS-001, I18N-001, BASE-002). Conteúdo institucional não verificado aparece com o selo "Conteúdo em verificação"; `NEXT_PUBLIC_CONTENT_MODE=strict` o oculta. Site público é servido em `/pt` e `/en`; defina `NEXT_PUBLIC_SITE_URL` em produção para canonical/sitemap absolutos.

