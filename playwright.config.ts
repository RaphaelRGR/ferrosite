import { defineConfig, devices } from "@playwright/test";

/**
 * Dois projetos:
 * - e2e: smoke das rotas, links internos e reduced motion (roda no CI).
 * - baseline: captura de screenshots de regressão em docs/baseline/screenshots
 *   (sob demanda: `npm run baseline:screenshots`).
 *
 * O servidor é o build de produção (`next start`), então `npm run build`
 * precisa ter sido executado antes. Use PLAYWRIGHT_BASE_URL para apontar
 * para um servidor já em execução.
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
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
