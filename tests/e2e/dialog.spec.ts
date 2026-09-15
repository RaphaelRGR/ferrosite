import { expect, test } from "@playwright/test";

/**
 * Dialog (DS-001): trap de foco, Escape, retorno de foco e scroll lock —
 * no catálogo e no uso real (modal de disciplina do fluxograma).
 */
test("catálogo: diálogo abre, prende o foco, fecha com Escape e devolve o foco", async ({ page }) => {
  await page.goto("/design-system", { waitUntil: "load" });
  const opener = page.getByRole("button", { name: "Abrir diálogo" }).first();
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Exemplo de diálogo" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  // Tab várias vezes: o foco nunca sai do diálogo.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("fluxograma: clicar em uma disciplina abre um diálogo acessível com seu nome", async ({ page }) => {
  await page.goto("/pt/curso", { waitUntil: "load" });
  const card = page.getByText("EMB5001", { exact: true }).first();
  await card.scrollIntoViewIfNeeded();
  await card.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(/Cálculo Diferencial e Integral I/);
  await expect(dialog).toContainText("EMB5001");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
