import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * FLOW-002 (critérios de 09): três matrizes na URL, seleção mostra ancestrais e
 * dependentes com legenda textual, mouse/toque/teclado equivalentes, diálogo
 * acessível, lista equivalente, optativas, reduced motion não remove informação.
 */
const REGION = /Grafo curricular/;

test.describe("explorador do fluxograma", () => {
  test("clique seleciona, mostra pré-requisitos/dependentes e grava na URL; segundo clique abre detalhes", async ({ page }) => {
    await page.goto("/pt/curso#fluxograma", { waitUntil: "load" });
    const region = page.getByRole("region", { name: REGION });
    await region.scrollIntoViewIfNeeded();

    const card = region.getByRole("button", { name: /^EMB5535 / });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#fluxograma [aria-live="polite"]')).toContainText(/EMB5535 .*: \d+ pré-requisitos e \d+ dependentes/);
    await expect(region.getByRole("button", { name: /^EMB5011 .*Pré-requisito/ })).toBeAttached();
    await expect(region.getByRole("button", { name: /^EMB5544 .*Dependente/ })).toBeAttached();
    expect((await region.locator("svg path").count())).toBeGreaterThan(3);
    await expect(page).toHaveURL(/disciplina=EMB5535/);

    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(/Via Permanente/);
    await expect(dialog).toContainText("Ementa oficial");
    await expect(dialog).toContainText("Dependentes");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("teclado: setas navegam, Enter seleciona, Shift+Enter abre detalhes, Escape limpa", async ({ page }) => {
    await page.goto("/pt/curso#fluxograma", { waitUntil: "load" });
    const region = page.getByRole("region", { name: REGION });
    await region.scrollIntoViewIfNeeded();
    const first = region.getByRole("button", { name: /^EMB5001 / });
    await first.focus();
    await page.keyboard.press("ArrowDown");
    await expect(region.getByRole("button", { name: /^EMB5005 / })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("aria-label", /^EMB\d{4} /);
    await page.keyboard.press("Enter");
    await expect(focused).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#fluxograma [aria-live="polite"]')).not.toHaveText("Nenhuma disciplina selecionada.");
    await page.keyboard.press("Shift+Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator('#fluxograma [aria-live="polite"]')).toHaveText("Nenhuma disciplina selecionada.");
  });

  test("URL abre matriz 2012 com disciplina selecionada, mostra aviso de pré-requisitos legados e coluna de optativas", async ({ page }) => {
    await page.goto("/pt/curso?matriz=2012&disciplina=EMB5512#fluxograma", { waitUntil: "load" });
    await expect(page.getByRole("radio", { name: "Grade 2012" })).toBeChecked();
    await expect(page.getByRole("note")).toContainText("2012");
    const region = page.getByRole("region", { name: REGION });
    await expect(region.getByRole("heading", { name: "Optativas" })).toBeAttached();
    // EMB5107 é optativa e pré-requisito de EMB5512: agora aparece e é marcada
    await expect(region.getByRole("button", { name: /^EMB5107 .*Pré-requisito/ })).toBeAttached();
  });

  test("lista equivalente mantém seleção e relações em texto", async ({ page }) => {
    await page.goto("/pt/curso?disciplina=EMB5535&vista=lista#fluxograma", { waitUntil: "load" });
    await expect(page.getByRole("radio", { name: "Lista" })).toBeChecked();
    await expect(page.getByRole("region", { name: REGION })).toHaveCount(0);
    const item = page.getByRole("button", { name: /EMB5535 Via Permanente/ });
    await expect(item).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Pré-requisitos: EMB5011, EMB5012")).toBeAttached();
  });

  test("busca por nome seleciona a disciplina; ajustar à largura reduz o zoom", async ({ page }) => {
    await page.goto("/pt/curso#fluxograma", { waitUntil: "load" });
    await page.getByRole("searchbox", { name: "Buscar disciplina" }).fill("locomotivas");
    await page.getByRole("button", { name: /EMB5542/ }).first().click();
    await expect(page.locator('#fluxograma [aria-live="polite"]')).toContainText("EMB5542");
    await page.getByRole("button", { name: "Ajustar à largura" }).click();
    const zoom = await page.getByRole("region", { name: REGION }).locator("> div").evaluate((el) => getComputedStyle(el).zoom);
    expect(Number(zoom)).toBeLessThan(1);
  });

  test("axe: página do curso com o explorador sem violações sérias/críticas", async ({ page }) => {
    await page.goto("/pt/curso?disciplina=EMB5535#fluxograma", { waitUntil: "load" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("seleção e linhas continuam visíveis", async ({ page }) => {
    await page.goto("/pt/curso?disciplina=EMB5544#fluxograma", { waitUntil: "load" });
    const region = page.getByRole("region", { name: REGION });
    await expect(region.getByRole("button", { name: /^EMB5544 / })).toHaveCSS("opacity", "1");
    expect(await region.locator("svg path").count()).toBeGreaterThan(3);
  });
});
