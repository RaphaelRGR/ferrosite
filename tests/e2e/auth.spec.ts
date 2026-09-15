import { expect as baseExpect, test } from "@playwright/test";

// Login/Server Actions contra a nuvem com o runner cheio: asserções esperam mais que o padrão de 5 s.
const expect = baseExpect.configure({ timeout: 30_000 });

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
  // Mesma conta em todos os testes: em série para o estado de um teste não confundir o outro.
  test.describe.configure({ mode: "serial" });
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD para o fluxo autenticado");

  test("login por senha cria sessão; perfil ativo vê o shell, pendente vê o bloqueio; logout encerra", async ({ page }) => {
    await page.goto("/login?next=/portal/projetos", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email!);
    await page.getByLabel("Senha").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/portal/projetos");

    await expect(page.locator("main#conteudo")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator('html[data-theme] main#conteudo')).toHaveCount(1);

    const h1 = page.getByRole("heading", { level: 1 }).first();
    // redirect de Server Action: a URL muda antes de o DOM da nova rota chegar
    await expect(h1).not.toHaveText("Entrar no Portal");
    await expect(h1).toBeVisible();
    const title = await h1.innerText();
    if (/Acesso (pendente|desativado)/i.test(title)) {
      test.info().annotations.push({ type: "note", description: "perfil não ativo (schema não aplicado ou conta pendente): validado o bloqueio" });
      await expect(page.getByRole("navigation", { name: "Menu do Portal" })).toHaveCount(0);
    } else {
      await expect(page.getByRole("navigation", { name: "Menu do Portal" }).first()).toBeAttached();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projetos");
    }

    // /login com sessão vai para o Portal
    const res = await page.request.get("/login", { maxRedirects: 0 });
    expect(res.status()).toBe(307);

    await page.getByRole("banner").getByRole("button", { name: "Sair" }).click();
    await page.waitForURL("**/login");
    const after = await page.request.get("/portal", { maxRedirects: 0 });
    expect(after.status()).toBe(307);
  });

  test("tema persiste entre rotas e recarregamentos sem flash", async ({ page }) => {
    await page.goto("/login", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email!);
    await page.getByLabel("Senha").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/portal");

    const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().endsWith("/portal"));
    await page.locator("label", { hasText: "Escuro" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await saved; // Server Action gravou o cookie
    await page.goto("/portal/configuracoes", { waitUntil: "load" });
    // Já vem escuro do servidor (cookie aplicado no <html>), sem depender de JS.
    const ssrTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(ssrTheme).toBe("dark");
    const savedLight = page.waitForResponse((r) => r.request().method() === "POST");
    await page.locator("label", { hasText: "Claro" }).first().click();
    await savedLight;
    await page.reload({ waitUntil: "load" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
