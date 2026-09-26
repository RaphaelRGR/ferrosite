import { expect, test } from "@playwright/test";

/**
 * Bloco C da auditoria de design: identidade dos projetos por categoria, foto
 * real no hero do Curso e ritmo de fundos alternados na Home.
 */
test("projetos: todo cartão tem foto ou capa ilustrada da categoria, e o selo tem ícone e texto", async ({ page }) => {
  await page.goto("/pt/projetos", { waitUntil: "load" });
  const cartoes = page.locator('[data-published="live"] li');
  test.skip((await cartoes.count()) === 0, "sem projetos públicos neste ambiente");
  for (const c of await cartoes.all()) {
    expect((await c.locator("img").count()) + (await c.locator("[data-project-cover]").count())).toBe(1);
    const selo = c.locator("[data-category]");
    await expect(selo).toHaveCount(1);
    await expect(selo.locator("svg")).toHaveCount(1); // não depende só da cor
    await expect(selo).toHaveText(/\S/);
  }
  // capa ilustrada usa a cor da categoria (token), não o fundo transparente
  const capa = page.locator("[data-project-cover]").first();
  if (await capa.count()) expect(await capa.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
});

test("curso: hero com a foto institucional (proxy de mídia, com alt e crédito) quando liberada", async ({ page }) => {
  await page.goto("/pt/curso", { waitUntil: "load" });
  const foto = page.locator("main section").first().locator("figure img");
  test.skip((await foto.count()) === 0, "capa do Curso não definida neste ambiente");
  await expect(foto).toHaveAttribute("src", /^\/api\/midia\/[0-9a-f-]{36}\?w=\d+$/);
  await expect(foto).toHaveAttribute("alt", /\S/);
  await expect(page.locator("main section").first().locator("figcaption")).toContainText("Foto:");
});

test("Home: seções consecutivas não repetem o mesmo fundo (como sai em produção)", async ({ page }) => {
  await page.goto("/pt", { waitUntil: "load" });
  // seções em quarentena só existem em preview/local (review); em produção (strict) não são renderizadas
  const fundos = await page
    .locator("main > section, main > div > section")
    .evaluateAll((els) => els.filter((e) => !e.closest('[data-content-status="unverified"]')).map((e) => getComputedStyle(e).backgroundColor));
  for (let i = 1; i < fundos.length; i++) expect(fundos[i], `seções ${i} e ${i + 1}`).not.toBe(fundos[i - 1]);
});
