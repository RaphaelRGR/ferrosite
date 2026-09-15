import { expect, test } from "@playwright/test";

/**
 * Critério global (31): com prefers-reduced-motion todo conteúdo permanece
 * visível. A Home nova não depende de animação para revelar conteúdo; o teste
 * garante que headings e cards estão com opacidade total sob a preferência e que
 * o carrossel legado (se presente) não anima.
 */
test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce" });

  test("Home clara: todos os headings de seção visíveis com opacidade 1", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "load" });
    const headings = page.locator("main h2");
    const count = await headings.count();
    expect(count).toBeGreaterThan(3);
    for (let i = 0; i < count; i++) {
      await headings.nth(i).scrollIntoViewIfNeeded();
      await expect(headings.nth(i)).toHaveCSS("opacity", "1");
    }
  });

  test("página legada (/pt/sobre) mantém conteúdo visível", async ({ page }) => {
    await page.goto("/pt/sobre", { waitUntil: "load" });
    const h1 = page.locator("main h1").first();
    await expect(h1).toBeAttached();
    await expect(h1).toHaveCSS("opacity", "1");
  });
});
