# Testes

| Suíte | Comando | Contra o quê |
|---|---|---|
| Unitários | `npm test` | nada externo |
| RLS | `npm run test:rls` | Postgres embutido com as migrations reais |
| Integração | `npm run test:integration` | projeto Supabase **de testes** (`.env.test.local`); pula sem ele |
| E2E | `npm run test:e2e` | build próprio (`.next-e2e`) + projeto Supabase **de testes** |

## Projeto Supabase de testes (TEST-001)

O e2e cria dados de verdade a cada rodada: projetos, empresas, desafios, notícias, ações, processos e
uploads. Por isso ele **nunca** roda contra a produção. `scripts/e2e.mjs` e `playwright.config.ts` exigem o
`.env.test.local` e recusam um arquivo que aponte para o mesmo projeto do `.env.local`.

### Montar uma vez

1. Supabase (mesma conta do projeto do site) → **New project**: nome `ferrosite-testes`, região
   **South America (São Paulo)**, plano Free. Guarde a senha do banco.
2. Copie `.env.test.example` para `.env.test.local` e preencha URL, chave anon, service role, ref, senha e
   a URL do *session pooler*. O arquivo fica fora do git (`.env*`).
3. `npm run test:db:setup`. O script é idempotente:
   - aplica todas as migrations (`npm run db:push:test`);
   - cria/atualiza as contas `e2e-admin`, `e2e-reviewer` (coordenação) e `e2e-member` com senhas aleatórias
     gravadas no `.env.test.local`;
   - copia da produção só o **conteúdo público**: projetos públicos e publicações no ar. Autoria vira a
     conta admin de teste; notas internas, empresas, contatos e arquivos não são copiados (fotos ficam sem
     arquivo).

### Rodar

```bash
npm run test:e2e                                   # build de testes + suíte inteira
npm run test:e2e -- --no-build tests/e2e/x.spec.ts # reaproveita o build e roda um arquivo
npm run test:e2e -- --workers=1                    # em série (diagnóstico de lentidão)
```

- O build de testes fica em `.next-e2e`; o `npm run build` normal continua em `.next`.
- Um `next start` esquecido na porta 3100 é reaproveitado pelo Playwright: encerre-o antes se o build mudou.
- Sem conexão com o Google Drive no projeto de testes, os testes de foto e de envio ao Drive verificam o
  estado "não conectado" ou são pulados.
- O banco de testes pode ser zerado à vontade: apague o projeto, crie outro e rode `npm run test:db:setup`.

### CI

O GitHub Actions roda sem `.env.test.local` (sem Supabase): os testes que dependem do Portal são pulados.
Para rodá-los no CI, crie os segredos do projeto de testes no repositório e gere o arquivo no workflow.
