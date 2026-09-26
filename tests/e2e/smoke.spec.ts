import { expect, test } from "@playwright/test";
import { CATALOG_ROUTE, GRADE_ASSETS, HTML_ROUTES, PORTAL_ROUTES, PUBLIC_ROUTES } from "../helpers/routes";

/**
 * Smoke: cada rota existente responde e renderiza sem exceção não tratada.
 * Não valida conteúdo — só que a baseline continua de pé.
 */

// Recursos externos (imagens remotas de placeholder) falhando não são regressão do app.
const IGNORED_CONSOLE = [/Failed to load resource/i];

for (const route of HTML_ROUTES) {
  test(`GET ${route} responde 200 e renderiza um h1 sem erros de página`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !IGNORED_CONSOLE.some((re) => re.test(msg.text()))) {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto(route, { waitUntil: "load" });
    expect(response?.status(), `status de ${route}`).toBe(200);

    await expect(page.locator("h1").first()).toBeAttached();
    expect(pageErrors, `exceções em ${route}`).toEqual([]);
    expect(consoleErrors, `console.error em ${route}`).toEqual([]);
  });
}

/**
 * Landmarks (ARCH-001 / critério global de 31): exatamente um <main> com id
 * "conteudo", um skip link apontando para ele, e o shell público não vaza
 * para o Portal (nem o do Portal para o site).
 */
for (const route of HTML_ROUTES) {
  test(`${route} tem um único <main id="conteudo"> e um skip link`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("main#conteudo")).toHaveCount(1);
    await expect(page.locator('a[href="#conteudo"]')).toHaveCount(1);
  });
}

for (const route of PUBLIC_ROUTES) {
  test(`${route} usa o shell público (Navbar + footer) sem shell do Portal`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });
    await expect(page.getByRole("navigation", { name: /Navegação principal|Main navigation/ })).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Portal" })).toHaveCount(0);
    // Site público claro (PUBLIC-001): tema no <html>, sem escopos escuros novos.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
}

for (const route of PORTAL_ROUTES) {
  test(`${route} anônimo é redirecionado para /login com next allowlisted`, async ({ request }) => {
    const res = await request.get(route, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    const location = new URL(res.headers()["location"], "http://x");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(route);
  });
}

test("catálogo de componentes não é indexável e fica fora da navegação pública", async ({ page }) => {
  await page.goto(CATALOG_ROUTE, { waitUntil: "load" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/pt", { waitUntil: "load" });
  await expect(page.locator(`a[href="${CATALOG_ROUTE}"]`)).toHaveCount(0);
});

for (const asset of GRADE_ASSETS) {
  test(`GET ${asset} continua servido (PDF oficial da grade)`, async ({ request }) => {
    const response = await request.get(asset);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/application\/pdf/);
  });
}

test("rota inexistente responde 404 com a página not-found", async ({ page }) => {
  const response = await page.goto("/pt/rota-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText(/não encontrada/i);
  await expect(page.getByRole("link", { name: /página inicial/i })).toBeAttached();
  // A 404 continua dentro do shell público, com um único <main>.
  await expect(page.locator("main#conteudo")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: /Navegação principal|Main navigation/ })).toHaveCount(1);
});

test("callback sem código não cria sessão: volta ao login com erro", async ({ request }) => {
  const response = await request.get("/api/auth/callback", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  const location = new URL(response.headers()["location"], "http://localhost");
  expect(location.pathname).toBe("/login");
  expect(location.searchParams.get("error")).toBe("callback");
});
