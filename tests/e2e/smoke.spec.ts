import { expect, test } from "@playwright/test";
import { GRADE_ASSETS, HTML_ROUTES } from "../helpers/routes";

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

for (const asset of GRADE_ASSETS) {
  test(`GET ${asset} continua servido (fallback documental das grades)`, async ({ request }) => {
    const response = await request.get(asset);
    expect(response.status()).toBe(200);
    const type = response.headers()["content-type"] ?? "";
    expect(type).toMatch(asset.endsWith(".pdf") ? /application\/pdf/ : /text\/html/);
  });
}

test("rota inexistente responde 404 com a página not-found", async ({ page }) => {
  const response = await page.goto("/rota-que-nao-existe");
  expect(response?.status()).toBe(404);
  // A not-found atual usa <h2> e não tem <h1> (critério 31 pendente); só garante que renderizou.
  await expect(page.getByRole("heading").first()).toBeAttached();
  await expect(page.getByRole("link", { name: /página inicial/i })).toBeAttached();
});

test("callback OAuth ainda é um stub: redireciona incondicionalmente para /portal", async ({ request }) => {
  // Documenta o comportamento atual (P0 da auditoria); AUTH-002 substitui por exchangeCodeForSession.
  const response = await request.get("/api/auth/callback", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers()["location"], "http://localhost").pathname).toBe("/portal");
});

test("Portal está aberto para anônimo (estado conhecido, a ser fechado em AUTH-002)", async ({ request }) => {
  const response = await request.get("/portal", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
});
