import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

/**
 * TEST-001: o e2e roda contra um projeto Supabase SÓ DE TESTES (`.env.test.local`), nunca contra a
 * produção, porque cada rodada cria projetos, empresas, ações e uploads de verdade. O servidor é o build
 * próprio em `.next-e2e` (`npm run test:e2e` gera; NEXT_PUBLIC_* ficam embutidos no build).
 * No CI sem esse arquivo, segue sem Supabase (os testes do Portal são pulados).
 */
const TEST_ENV_FILE = ".env.test.local";
const testEnv: Record<string, string> = {};
if (existsSync(TEST_ENV_FILE)) {
  for (const line of readFileSync(TEST_ENV_FILE, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (line.startsWith("#") || i < 0) continue;
    testEnv[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
} else if (!process.env.CI && !process.env.PLAYWRIGHT_BASE_URL) {
  throw new Error(`${TEST_ENV_FILE} não existe: o e2e não roda contra a produção. Veja docs/TESTING.md.`);
}
// credenciais das contas de teste (E2E_*) para as specs; o ambiente explícito vence
for (const [k, v] of Object.entries(testEnv)) if (!(k in process.env)) process.env[k] = v;
const serverEnv = existsSync(TEST_ENV_FILE) ? { ...process.env, ...testEnv, NEXT_DIST_DIR: ".next-e2e" } as Record<string, string> : undefined;

/**
 * Dois projetos:
 * - e2e: smoke das rotas, links internos e reduced motion (roda no CI).
 * - baseline: captura de screenshots de regressão em docs/baseline/screenshots
 *   (sob demanda: `npm run baseline:screenshots`).
 *
 * Use PLAYWRIGHT_BASE_URL para apontar para um servidor já em execução.
 */
const PORT = 3100;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // PERF-002: o Portal mostra o esqueleto (loading.tsx) assim que o link é clicado e o
  // conteúdo chega depois por streaming; a espera que antes ficava na navegação
  // (waitForURL, 30 s) passou para as asserções. 10 s absorve a suíte em paralelo.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "pt-BR",
  },
  projects: [
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "baseline",
      testDir: "./tests/baseline",
      use: { ...devices["Desktop Chrome"] },
      timeout: 120_000,
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        env: serverEnv,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
