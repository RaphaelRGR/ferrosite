# TEST-001: projeto Supabase separado para os testes

Data: 2026-10-09 · Pedido: "configura um projeto Supabase separado para os testes".

## Motivo

O e2e rodava contra o banco de produção e deixava sobras a cada rodada. Em 2026-10-09 foi preciso remover 31 projetos, 30 empresas, 33 desafios, 29 notícias, 197 ações e 5 processos de teste, além de uma pasta com 51 imagens no Drive institucional.

## Decisões do usuário

- O projeto de testes fica na **mesma conta Supabase do site**, criado pelo usuário no painel (o CLI desta máquina está em outra conta, que já usa as 2 vagas gratuitas). Os segredos vão direto para `.env.test.local`, sem passar pelo chat.
- O banco de testes recebe uma **cópia do conteúdo público** para os testes do site terem o que verificar.

## Entregue

| Peça | O que faz |
|---|---|
| `.env.test.example` → `.env.test.local` | Chaves do projeto de testes (fora do git). |
| `scripts/lib/env-file.mjs` | `requireTestEnv()`: recusa arquivo ausente, incompleto ou com o mesmo ref da produção. |
| `npm run db:push:test` | Migrations no projeto de testes. |
| `npm run test:db:setup` | Idempotente: migrations, contas `e2e-admin`/`e2e-reviewer`/`e2e-member` (senhas aleatórias gravadas no arquivo) e cópia do conteúdo público (projetos públicos e publicações no ar; autoria vira a conta admin de teste; sem notas internas, empresas, contatos nem arquivos). |
| `npm run test:e2e` (`scripts/e2e.mjs`) | Build próprio em `.next-e2e` com as variáveis de teste (NEXT_PUBLIC_* ficam embutidas no build) e Playwright contra ele; `--no-build` reaproveita o build. |
| `playwright.config.ts` | Lê só o `.env.test.local`; sem ele (fora do CI) recusa rodar. |
| `vitest.integration.config.ts` | Integração usa o projeto de testes; sem ele os testes pulam (antes criavam usuários na produção). |
| `next.config.ts` | `distDir` por `NEXT_DIST_DIR` (padrão `.next`). |
| `docs/TESTING.md` | Como montar, rodar e zerar o ambiente de testes. |

## Validação

- Bloqueios conferidos: arquivo incompleto → recusa; arquivo apontando para a produção → recusa ("aponta para o projeto de PRODUÇÃO").
- `playwright test --list` (486 testes), typecheck, lint dos arquivos alterados, `npm run test:integration` pulando sem o projeto de testes.
- Execução completa do `test:db:setup` e do e2e no projeto novo: assim que o `.env.test.local` for preenchido.

## Pendências

- Usuário: criar o projeto `ferrosite-testes` (São Paulo, Free) e preencher `.env.test.local`.
- As contas e2e antigas continuam no Auth da produção; remover quando o ambiente de testes estiver rodando.
- CI: segue sem Supabase (testes do Portal pulados) até haver segredos do projeto de testes no GitHub.
