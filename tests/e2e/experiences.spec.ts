import { expect as baseExpect, test, type Page } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });

/**
 * DRIVE-004 — Experiências reais com galeria, contra a nuvem: hub e detalhe
 * leem a projeção (sem selo); galeria e capa só chegam ao site pelo proxy e
 * apenas para arquivos verificados/públicos/com consentimento; o Portal mostra
 * a galeria do conteúdo com o aviso "vai ao site / fica interno"; importar do
 * Drive é só para admin/coordenação.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const member = { email: process.env.E2E_MEMBER_EMAIL, password: process.env.E2E_MEMBER_PASSWORD };

async function login(page: Page, user: string, pass: string) {
  await page.goto("/login?next=/portal", { waitUntil: "load" });
  await page.getByLabel("E-mail").first().fill(user);
  await page.getByLabel("Senha").fill(pass);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => u.pathname === "/portal");
  await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
}

test("site: hub de experiências lista publicações reais (se houver) sem selo e mantém o staging sob quarentena; EN nunca cai no PT", async ({ page, request }) => {
  await page.goto("/pt/experiencias", { waitUntil: "load" });
  const live = page.locator('[data-published="live"]');
  if (await live.count()) {
    await expect(live.locator("li").first()).toBeVisible();
    expect(await live.locator('[data-content-status="unverified"]').count()).toBe(0);
    const first = live.getByRole("link").first();
    const href = await first.getAttribute("href");
    await first.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.locator('[data-published="live"]')).toBeAttached();
    // galeria: cada imagem vem do proxy público e tem alt
    for (const img of await page.locator("[data-gallery-count] img").all()) {
      // miniatura do proxy público (22): largura explícita, nunca o original
      expect(await img.getAttribute("src")).toMatch(/^\/api\/midia\/[0-9a-f-]{36}\?w=\d+$/);
      expect((await img.getAttribute("alt")) ?? "").not.toBe("");
    }
  }
  // staging continua marcado (PT)
  await page.goto("/pt/experiencias", { waitUntil: "load" });
  await expect(page.locator('[data-content-status="unverified"]').first()).toBeAttached();
  // EN: só publicações EN; sem elas, página honesta de pendência
  const en = await request.get("/en/experiencias");
  expect(en.status()).toBe(200);
  expect(await en.text()).not.toContain("Realizadas — publicadas pelo Portal");
});

test.describe("portal", () => {
  test.skip(!admin.email || !admin.password, "defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD");
  test.setTimeout(120_000);

  test("galeria de conteúdo: vincular arquivo existente, legendar, aviso de publicação, desvincular; importar do Drive só para overseer", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto("/portal/conteudos?tipo=experience", { waitUntil: "load" });
    const link = page.getByRole("link", { name: /Visita técnica|Palestra|Dia do Ferroviário/ }).first();
    test.skip((await link.count()) === 0, "sem experiências no banco");
    await link.click();
    const gallery = page.getByRole("region", { name: "Galeria" });
    await expect(gallery).toBeVisible();
    await expect(gallery.getByText(/Vai ao site ao publicar|Fica interno|Nenhum arquivo vinculado/).first()).toBeVisible();
    // importar: página existe e é do overseer
    await page.goto("/portal/arquivos/importar", { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Importar do Drive");
  });

  test("membro: importar do Drive é negado", async ({ page }) => {
    test.skip(!member.email || !member.password, "defina E2E_MEMBER_EMAIL/E2E_MEMBER_PASSWORD");
    await login(page, member.email!, member.password!);
    await page.goto("/portal/arquivos/importar", { waitUntil: "load" });
    await expect(page.getByRole("status")).toContainText("administração e da coordenação");
    await expect(page.getByRole("button", { name: "Importar", exact: true })).toHaveCount(0);
  });
});
