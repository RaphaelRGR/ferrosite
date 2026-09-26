import { expect, test } from "@playwright/test";

/**
 * Bloco B da auditoria de design: hub de Experiências com foto, agrupado por
 * ano e filtrável por tipo/ano na URL; capa padrão da marca para experiência
 * sem foto; metadados curtos (tipo · data, local em linha própria).
 */
test("hub: cartões com foto agrupados por ano, do mais recente ao mais antigo", async ({ page }) => {
  await page.goto("/pt/experiencias", { waitUntil: "load" });
  const anos = await page.locator('section[aria-labelledby^="ano-"] > h3').evaluateAll((hs) => hs.map((h) => Number(h.firstChild?.textContent)));
  test.skip(anos.length === 0, "sem experiências publicadas neste ambiente");
  expect(anos).toEqual([...anos].sort((a, b) => b - a));
  const cartoes = page.locator('[data-published="live"] li');
  expect(await cartoes.count()).toBeGreaterThan(0);
  // todo cartão tem imagem da experiência ou a capa padrão — nunca bloco vazio
  for (const c of await cartoes.all()) {
    expect((await c.locator("img").count()) + (await c.locator("[data-fallback-cover]").count())).toBe(1);
    await expect(c.locator("p").first()).toHaveText(/^(Visita técnica|Palestra|Evento) · \d{1,2} de /);
  }
});

test("filtro por tipo e por ano vive na URL e mantém só o que corresponde", async ({ page }) => {
  await page.goto("/pt/experiencias", { waitUntil: "load" });
  const total = await page.locator('[data-published="live"] li').count();
  test.skip(total === 0, "sem experiências publicadas neste ambiente");

  await page.locator('nav[aria-label="Filtrar por tipo"]').getByRole("link", { name: "Visita técnica" }).click();
  await expect(page).toHaveURL(/\?tipo=visita$/);
  await expect(page.locator('nav[aria-label="Filtrar por tipo"] a[aria-current="page"]')).toHaveText("Visita técnica");
  for (const t of await page.locator('[data-published="live"] li h3').allTextContents()) expect(t).toMatch(/^Visita/);

  const anos = page.locator('nav[aria-label="Filtrar por ano"]');
  if (await anos.count()) {
    const ano = (await anos.getByRole("link").nth(1).textContent())!.trim();
    await anos.getByRole("link", { name: ano }).click();
    await expect(page).toHaveURL(new RegExp(`tipo=visita&ano=${ano}$`));
    await expect(page.locator('section[aria-labelledby^="ano-"] > h3')).toHaveCount(1);
  }
  // valor inválido na URL cai em "todos" sem quebrar
  await page.goto("/pt/experiencias?tipo=xyz&ano=1900", { waitUntil: "load" });
  await expect(page.locator('[data-published="live"] li')).toHaveCount(total);
});

test("experiência sem foto usa a capa padrão da marca, decorativa", async ({ page }) => {
  await page.goto("/pt/experiencias", { waitUntil: "load" });
  const capa = page.locator("[data-fallback-cover]").first();
  test.skip((await capa.count()) === 0, "todas as experiências têm foto neste ambiente");
  await expect(capa).toHaveAttribute("aria-hidden", "true");
  await expect(capa).toContainText(/Visita técnica|Palestra|Evento/);
});

test("Home: sem notícia publicada, o CTA final não oferece 'Acompanhe as notícias'", async ({ page, request }) => {
  const noticias = await (await request.get("/pt/noticias")).text();
  const temNoticia = noticias.includes('aria-labelledby="noticias-publicadas"');
  await page.goto("/pt", { waitUntil: "load" });
  await expect(page.getByRole("link", { name: "Acompanhe as notícias" })).toHaveCount(temNoticia ? 1 : 0);
  await expect(page.getByRole("link", { name: "Conheça o curso" }).last()).toBeVisible();
});
