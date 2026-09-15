import { expect, test } from "@playwright/test";

/**
 * AUTH-002: guard fail-closed, allowlist de redirect, callback inválido e
 * login/logout reais. O fluxo autenticado só roda com credenciais de teste
 * (E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD) de um usuário ATIVO no projeto Supabase.
 */
const location = (headers: Record<string, string>) => new URL(headers["location"], "http://x");

test.describe("anônimo", () => {
  test("/portal e sub-rotas redirecionam para /login preservando o destino", async ({ request }) => {
    for (const path of ["/portal", "/portal/projetos", "/portal/acervo"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(307);
      const url = location(res.headers());
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.get("next")).toBe(path);
    }
  });

  test("/login renderiza formulário acessível e neutraliza next externo", async ({ page }) => {
    await page.goto("/login?next=https://evil.example/phish", { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Entrar no Portal");
    await expect(page.getByLabel("E-mail").first()).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.locator('input[name="next"]').first()).toHaveValue("/portal");
    await expect(page.locator("main")).toHaveCount(1);
  });

  test("callback com código inválido não cria sessão", async ({ request }) => {
    const res = await request.get("/api/auth/callback?code=invalid-code&next=/portal", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    const url = location(res.headers());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("error")).toBe("callback");
    expect(res.headers()["set-cookie"] ?? "").not.toMatch(/sb-.*-auth-token=[^;]{20,}/);
  });

  test("credenciais inválidas mostram erro genérico e continuam em /login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill("nao-existe@example.invalid");
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    // getByRole("alert") também casa com o route announcer do Next; filtra pelo texto.
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha inválidos." })).toBeVisible({ timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});

test.describe("autenticado", () => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD para o fluxo autenticado");

  test("login por senha entra no Portal, shell próprio, e logout volta ao login", async ({ page }) => {
    await page.goto("/login?next=/portal/projetos", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email!);
    await page.getByLabel("Senha").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/portal/projetos");

    await expect(page.getByRole("navigation", { name: "Portal" })).toHaveCount(1);
    await expect(page.locator("main#conteudo")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator('[data-theme="light"] main#conteudo')).toHaveCount(1);

    // /login com sessão vai para o Portal
    const res = await page.request.get("/login", { maxRedirects: 0 });
    expect(res.status()).toBe(307);

    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL("**/login");
    const after = await page.request.get("/portal", { maxRedirects: 0 });
    expect(after.status()).toBe(307);
  });
});
