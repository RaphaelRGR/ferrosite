import { expect, test } from "@playwright/test";

/**
 * Critério de aceite global (31): com prefers-reduced-motion, todo conteúdo
 * permanece visível e com contraste normal. Antes da baseline, o manifesto
 * ficava com opacity 0 e a jornada esmaecida (opacity 0.2).
 */
test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce" });

  test("manifesto da Home fica totalmente visível", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "load" });
    const heading = page.getByTestId("manifesto-heading");
    await heading.scrollIntoViewIfNeeded();

    const words = heading.locator("span");
    const count = await words.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(words.nth(i)).toHaveCSS("opacity", "1");
    }
  });

  test("etapas da jornada acadêmica ficam com opacidade normal", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "load" });
    const steps = page.getByTestId("journey-step-content");
    const count = await steps.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await steps.nth(i).scrollIntoViewIfNeeded();
      await expect(steps.nth(i)).toHaveCSS("opacity", "1");
    }
  });
});

test.describe("movimento normal (guarda do caminho animado)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("manifesto aparece após entrar na viewport", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "load" });
    const heading = page.getByTestId("manifesto-heading");
    await heading.scrollIntoViewIfNeeded();
    // A última palavra é a que recebe o maior delay em cascata.
    await expect(heading.locator("span").last()).toHaveCSS("opacity", "1", { timeout: 10_000 });
  });
});
