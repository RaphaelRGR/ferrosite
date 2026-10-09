// npm run test:e2e (TEST-001): build próprio em .next-e2e apontando para o projeto Supabase de TESTES
// (.env.test.local) e Playwright contra ele. A produção nunca recebe fixtures.
//   npm run test:e2e                    → build + suíte inteira
//   npm run test:e2e -- --no-build      → reaproveita o último build de testes
//   npm run test:e2e -- tests/e2e/x.spec.ts --workers=1   → argumentos vão para o Playwright
// No CI sem .env.test.local, roda como antes (sem Supabase: os testes do Portal são pulados).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { requireTestEnv, TEST_ENV_FILE } from "./lib/env-file.mjs";

const args = process.argv.slice(2);
const noBuild = args.includes("--no-build");
const pwArgs = args.filter((a) => a !== "--no-build");
const run = (cmd, cmdArgs, env) => spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: true, env }).status ?? 1;

if (process.env.CI && !existsSync(TEST_ENV_FILE)) process.exit(run("npx", ["playwright", "test", "--project=e2e", ...pwArgs], process.env));

let test;
try {
  test = requireTestEnv();
} catch (e) {
  console.error(`${e.message}\nVeja docs/TESTING.md (projeto Supabase de testes).`);
  process.exit(2);
}
if (!test.E2E_ADMIN_PASSWORD) {
  console.error(`${TEST_ENV_FILE} sem contas de teste: rode npm run test:db:setup antes.`);
  process.exit(2);
}
// variáveis do arquivo de testes vencem as do .env.local (o Next não sobrescreve o que já está no ambiente)
const env = { ...process.env, ...test, NEXT_DIST_DIR: ".next-e2e", NEXT_PUBLIC_CONTENT_MODE: process.env.NEXT_PUBLIC_CONTENT_MODE || "review" };
if (!noBuild || !existsSync(".next-e2e/BUILD_ID")) {
  const status = run("npx", ["next", "build"], env);
  if (status !== 0) process.exit(status);
}
process.exit(run("npx", ["playwright", "test", "--project=e2e", ...pwArgs], env));
