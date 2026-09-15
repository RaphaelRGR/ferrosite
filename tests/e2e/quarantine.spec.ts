import { expect, test } from "@playwright/test";

/**
 * BASE-002: nenhuma métrica/notícia/parceria/data pública sem selo de verificação.
 * Em modo review (build de teste), cada seção inventariada carrega o selo visível
 * e o atributo data-content-status; o texto do selo segue o locale.
 */
const EXPECTED: Record<string, number> = {
  "/pt": 5,
  "/pt/curso": 6,
  "/pt/projetos": 1,
  "/pt/projetos/comunica-ferro": 1,
  "/pt/sobre": 4,
  "/pt/experiencias": 4,
  "/pt/eventos": 4,
  "/pt/noticias": 4,
};

for (const [route, count] of Object.entries(EXPECTED)) {
  test(`${route}: ${count} seções marcadas como conteúdo em verificação`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });
    const marked = page.locator('[data-content-status="unverified"]');
    await expect(marked).toHaveCount(count);
    const badges = page.locator('[data-content-status="unverified"] > p').filter({ hasText: "Conteúdo em verificação" });
    await expect(badges).toHaveCount(count);
    await expect(badges.first()).toBeVisible();
  });
}

test("/en: nenhuma seção em quarentena renderiza texto PT; editorial aparece como pendente", async ({ page }) => {
  await page.goto("/en", { waitUntil: "load" });
  await expect(page.locator('[data-content-status="unverified"]')).toHaveCount(0);
  await expect(page.getByText("Conteúdo em verificação")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Content in preparation" })).toBeAttached();
});

test("o selo explica a quarentena para leitores de tela", async ({ page }) => {
  await page.goto("/pt/curso", { waitUntil: "load" });
  const badge = page.locator('[data-content-section="curso.facts"] p').last();
  await expect(badge).toHaveAttribute("title", /não foi validado/);
  await expect(badge).toContainText("não foi validado");
});
