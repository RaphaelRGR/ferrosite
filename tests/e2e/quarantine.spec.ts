import { expect, test } from "@playwright/test";

/**
 * BASE-002: nenhuma métrica/notícia/parceria/data pública sem selo de verificação.
 * Em modo review (build de teste), cada seção inventariada carrega o selo visível
 * e o atributo data-content-status; o texto do selo segue o locale.
 */
const EXPECTED: Record<string, number> = {
  "/pt": 3, // indicadores, notícias e parceiros; o bloco de experiências do protótipo saiu (há experiências reais)
  "/pt/curso": 3, // sobre, dados básicos e pilares; fluxograma, grades e laboratórios verificados (2026-09-25)
  "/pt/projetos": 0, // hub só com projetos reais do Portal
  "/pt/projetos/comunica-ferro": 0,
  "/pt/sobre": 3,
  "/pt/experiencias": 1,
  "/pt/experiencias?escopo=internacional": 1,
  "/pt/eventos": 0,
  "/pt/noticias": 1,
  "/pt/noticias/noticias.grid.08mai": 1,
  "/pt/laboratorios": 0, // portfólio de laboratórios verificado
  "/pt/laboratorios?capacidade=logistica": 0,
  "/pt/laboratorios/lav": 0,
  "/pt/laboratorios/robotica": 0,
  "/pt/laboratorios/lasc": 0,
  "/pt/para-empresas": 0, // áreas de desafio derivam dos laboratórios verificados
};

for (const [route, count] of Object.entries(EXPECTED)) {
  test(`${route}: ${count} seções marcadas como conteúdo em verificação`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });
    const marked = page.locator('[data-content-status="unverified"]');
    await expect(marked).toHaveCount(count);
    const badges = page.locator('[data-content-status="unverified"] > p').filter({ hasText: "Conteúdo em verificação" });
    await expect(badges).toHaveCount(count);
    if (count > 0) await expect(badges.first()).toBeVisible();
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
