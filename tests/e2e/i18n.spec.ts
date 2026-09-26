import { expect, test } from "@playwright/test";
import { PUBLIC_PATHS, localized } from "../helpers/routes";

/**
 * I18N-001: roteamento por locale, redirects das URLs antigas, `lang`,
 * hreflang/canonical, seletor que preserva rota e ausência de mistura de idiomas.
 */
const location = (headers: Record<string, string>) => new URL(headers["location"], "http://x").pathname;

test.describe("redirects para o locale", () => {
  test("/ sem preferência vai para /pt (307)", async ({ request }) => {
    const res = await request.get("/", { maxRedirects: 0, headers: { "accept-language": "" } });
    expect(res.status()).toBe(307);
    expect(location(res.headers())).toBe("/pt");
  });

  test("Accept-Language en leva para /en; URL antiga /curso preserva o caminho", async ({ request }) => {
    const home = await request.get("/", { maxRedirects: 0, headers: { "accept-language": "en-US,en;q=0.9" } });
    expect(location(home.headers())).toBe("/en");
    const curso = await request.get("/curso", { maxRedirects: 0, headers: { "accept-language": "en-US,en;q=0.9" } });
    expect(location(curso.headers())).toBe("/en/curso");
  });

  test("cookie de escolha vence o Accept-Language", async ({ request }) => {
    const res = await request.get("/curso", {
      maxRedirects: 0,
      headers: { "accept-language": "en-US,en;q=0.9", cookie: "locale=pt" },
    });
    expect(location(res.headers())).toBe("/pt/curso");
  });

  test("Portal, login, catálogo e grades não recebem prefixo", async ({ request }) => {
    for (const path of ["/login", "/design-system", "/grades/grade2025.pdf"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
    }
    const portal = await request.get("/portal", { maxRedirects: 0 });
    expect(new URL(portal.headers()["location"], "http://x").pathname).toBe("/login");
  });
});

test.describe("documento por locale", () => {
  for (const path of PUBLIC_PATHS) {
    test(`${path}: lang, canonical e hreflang em pt e en`, async ({ page }) => {
      for (const [locale, lang] of [["pt", "pt-BR"], ["en", "en"]] as const) {
        await page.goto(localized(locale, path), { waitUntil: "load" });
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        const endsWith = (p: string) => new RegExp(`${p.replace(/\//g, "\\/")}$`);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", endsWith(localized(locale, path)));
        await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute("href", endsWith(localized("pt", path)));
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", endsWith(localized("en", path)));
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", endsWith(localized("pt", path)));
      }
    });
  }

  test("/en não mistura idiomas: navegação, rodapé, hero e CTA em inglês; editorial marcado como pendente", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Program" }).first()).toBeAttached();
    await expect(nav.getByRole("link", { name: "Curso" })).toHaveCount(0);
    await expect(page.locator("footer")).toContainText("All rights reserved.");
    await expect(page.locator("footer")).not.toContainText("direitos");
    await expect(page.getByRole("heading", { name: "Content in preparation" })).toBeAttached();
    await expect(page.getByTestId("manifesto-heading")).toHaveCount(0);
    // CTA final em inglês; o Portal (uso interno) saiu do CTA e fica no topo/rodapé
    await expect(page.getByRole("link", { name: "About the program" }).last()).toBeAttached();
    await expect(page.getByRole("link", { name: "Access the Portal" })).toHaveCount(0);
  });

  test("/en/curso mostra indisponibilidade explícita com link para o PT em vez de conteúdo em português", async ({ page }) => {
    await page.goto("/en/curso", { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page in preparation");
    await expect(page.getByRole("link", { name: "View in Portuguese" })).toHaveAttribute("href", "/pt/curso");
    await expect(page.getByText("A JORNADA TÉCNICA")).toHaveCount(0);
  });

  test("404 é localizada", async ({ page }) => {
    const res = await page.goto("/en/nada");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Page not found");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test("seletor de idioma preserva a rota e grava a escolha", async ({ page, context }) => {
  await page.goto("/pt/curso", { waitUntil: "load" });
  await page.getByRole("navigation", { name: "Idioma" }).first().getByRole("link", { name: "English" }).click();
  await page.waitForURL("**/en/curso");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const cookie = (await context.cookies()).find((c) => c.name === "locale");
  expect(cookie?.value).toBe("en");
  await page.getByRole("navigation", { name: "Language" }).first().getByRole("link", { name: "Português" }).click();
  await page.waitForURL("**/pt/curso");
});

test("sitemap e robots existem e cobrem os dois locales", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/pt/curso");
  expect(xml).toContain("/en/curso");
  expect(xml).toContain('hreflang="en"');
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /portal");
});
