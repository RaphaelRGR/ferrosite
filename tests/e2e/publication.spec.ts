import { expect, test } from "@playwright/test";

/**
 * PUB-001: o site lê só a projeção publicada. Sem publicações (banco não
 * migrado na nuvem) o hub de notícias segue com o staging sob quarentena e a
 * agenda vazia; pré-visualização por token nunca é indexável e tokens
 * inválidos/inexistentes dão 404; eventos inexistentes dão 404.
 */
test("notícias: sem publicações, só o staging (com selo); nenhum bloco 'publicado' falso", async ({ page }) => {
  await page.goto("/pt/noticias", { waitUntil: "load" });
  await expect(page.locator('[data-published="live"]')).toHaveCount(0);
  await expect(page.locator('[data-content-status="unverified"]')).toHaveCount(1);
  await expect(page.getByText("Publicadas pelo Portal")).toHaveCount(0);
});

test("pré-visualização: token curto ou desconhecido dá 404 e a rota é bloqueada no robots", async ({ page, request }) => {
  const short = await request.get("/pt/previa/abc");
  expect(short.status()).toBe(404);
  const unknown = await request.get(`/pt/previa/${"a".repeat(64)}`);
  expect(unknown.status()).toBe(404);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/pt\/previa\//);
  await page.goto("/pt/eventos/nao-existe", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/nao-existe/);
});

test("eventos: agenda vazia e honesta continua sem botões/formulários", async ({ page }) => {
  await page.goto("/pt/eventos", { waitUntil: "load" });
  await expect(page.getByText("Nenhum evento publicado ainda")).toBeAttached();
  await expect(page.locator("main form")).toHaveCount(0);
});
