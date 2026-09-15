import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CATALOG_ROUTE, LIGHT_PATHS, LOGIN_ROUTE, PUBLIC_ROUTES, localized } from "../helpers/routes";

/**
 * axe-core: sem violações sérias/críticas onde o novo design system é usado
 * (catálogo nos dois temas e Portal). Nas rotas públicas legadas, que serão
 * substituídas em PUBLIC-*, as violações são apenas registradas como baseline.
 */
const STRICT_ROUTES = [CATALOG_ROUTE, LOGIN_ROUTE, ...LIGHT_PATHS.flatMap((p) => [localized("pt", p), localized("en", p)])];

for (const route of STRICT_ROUTES) {
  test(`axe: ${route} sem violações sérias ou críticas`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: "load" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    await testInfo.attach(`axe-${route.replace(/\W+/g, "_")}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
}

// Inclui a 404: usa o shell público legado (Navbar/footer com texto white/30 e 8 px).
test("axe: baseline das rotas públicas legadas (registro, não bloqueia)", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const summary: Record<string, string[]> = {};
  for (const route of [...PUBLIC_ROUTES, "/pt/rota-que-nao-existe"]) {
    await page.goto(route, { waitUntil: "load" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    summary[route] = results.violations.map((v) => `${v.id} (${v.impact}) ×${v.nodes.length}`);
  }
  await testInfo.attach("axe-public-baseline.json", {
    body: JSON.stringify(summary, null, 2),
    contentType: "application/json",
  });
  expect(Object.keys(summary)).toHaveLength(PUBLIC_ROUTES.length + 1);
});
