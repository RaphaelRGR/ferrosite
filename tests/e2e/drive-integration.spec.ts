import { expect as baseExpect, test, type Page } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });

/**
 * DRIVE-002 — fundação da integração com o Google Drive contra a nuvem real:
 * TESTE 1 anônimo, TESTE 2 membro sem permissão, TESTE 3 admin vê "não
 * conectado", TESTE 4 início do OAuth (redirect ao Google com PKCE/state, sem
 * secret), TESTE 5 callback com state inválido/negado tratado, TESTE 9 desconectar
 * mantém estado, TESTE 10/11 tema escuro e mobile (capturas em test-results).
 * O consentimento real no Google é manual (conta de teste do app).
 */
const PAGE = "/portal/configuracoes/integracoes";
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const member = { email: process.env.E2E_MEMBER_EMAIL, password: process.env.E2E_MEMBER_PASSWORD };

async function login(page: Page, user: string, pass: string) {
  await page.goto("/login?next=/portal", { waitUntil: "load" });
  await page.getByLabel("E-mail").first().fill(user);
  await page.getByLabel("Senha").fill(pass);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => u.pathname === "/portal");
  await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
}

test("TESTE 1 — anônimo: página e rotas OAuth mandam para o login sem tocar no Google", async ({ request }) => {
  for (const path of [PAGE, "/api/auth/google/start", "/api/auth/google/callback?code=x&state=y"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/login\?next=/);
  }
});

test.describe("autenticado", () => {
  test.skip(!admin.email || !admin.password, "defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD");
  test.setTimeout(120_000);

  test("TESTE 2 — membro sem permissão: página nega e rotas respondem 403 (não só a UI)", async ({ page }) => {
    test.skip(!member.email || !member.password, "defina E2E_MEMBER_EMAIL/E2E_MEMBER_PASSWORD (conta member ativa)");
    await login(page, member.email!, member.password!);
    await page.goto(PAGE, { waitUntil: "load" });
    await expect(page.getByRole("status")).toContainText("administração e da coordenação");
    await expect(page.getByRole("link", { name: /Conectar Google Drive/ })).toHaveCount(0);
    expect((await page.request.get("/api/auth/google/start", { maxRedirects: 0 })).status()).toBe(403);
    expect((await page.request.get("/api/auth/google/callback?state=x", { maxRedirects: 0 })).status()).toBe(403);
    // Configurações não oferece o atalho de Integrações a quem não configura
    await page.goto("/portal/configuracoes", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: /Integrações/ })).toHaveCount(0);
  });

  test("TESTE 3/4/5/9/10/11 — admin: não conectado → início do OAuth → callback inválido → desconectar → temas e mobile", async ({ page, request }) => {
    await login(page, admin.email!, admin.password!);
    // garante estado inicial conhecido (desconectado) sem depender de rodadas anteriores
    await page.goto(PAGE, { waitUntil: "load" });
    const card = page.getByRole("region", { name: "Google Drive" });
    await expect(card).toBeVisible();
    if (await card.getByRole("button", { name: "Desconectar" }).count()) {
      await card.getByRole("button", { name: "Desconectar" }).first().click();
      await expect(card.getByRole("status").filter({ hasText: "Desconectado" })).toBeVisible();
      await page.goto(PAGE, { waitUntil: "load" });
    }
    // TESTE 3
    await expect(card.getByText("Não conectado", { exact: true })).toBeVisible();
    const connect = card.getByRole("link", { name: "Conectar Google Drive" });
    await expect(connect).toBeVisible();
    await expect(card.getByText(/token/i)).toHaveCount(0); // nunca expõe tokens

    // TESTE 4: início redireciona ao Google com PKCE e state; cookie httpOnly; sem secret na URL
    const configured = !(await card.getByText("Variáveis do OAuth ausentes").count());
    if (configured) {
      const start = await page.request.get("/api/auth/google/start", { maxRedirects: 0 });
      expect(start.status()).toBe(307);
      const location = new URL(start.headers()["location"]);
      expect(location.origin + location.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
      expect(location.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/drive.readonly");
      expect(location.searchParams.get("code_challenge_method")).toBe("S256");
      expect(location.searchParams.get("access_type")).toBe("offline");
      expect(location.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/google\/callback$/);
      expect(location.searchParams.get("client_secret")).toBeNull();
      const setCookie = start.headers()["set-cookie"] ?? "";
      expect(setCookie).toMatch(/gdrive_oauth=.+HttpOnly/i);
      // TESTE 5 (negativo): callback com state que não bate é recusado sem trocar nada
      await page.goto("/api/auth/google/callback?state=forjado&code=abc", { waitUntil: "load" });
      await expect(page).toHaveURL(/integracoes\?drive=state/);
      await expect(page.getByRole("alert")).toContainText("anti-CSRF");
      // negado pelo usuário/Google chega como access_denied e vira orientação sobre usuários de teste
      await page.goto("/api/auth/google/callback?state=forjado&error=access_denied", { waitUntil: "load" });
      await expect(page).toHaveURL(/integracoes\?drive=state/); // state inválido vence: nada é processado
    } else {
      // sem variáveis: o botão fica desabilitado e a página diz exatamente o que falta
      await expect(card.getByText(/GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|GOOGLE_REDIRECT_URI/)).toBeVisible();
      const start = await request.get("/api/auth/google/start", { maxRedirects: 0 });
      expect(start.status()).toBe(307);
    }
    // continua desconectado (TESTE 9 no estado inicial)
    await page.goto(PAGE, { waitUntil: "load" });
    await expect(card.getByText("Não conectado", { exact: true })).toBeVisible();

    // TESTE 10/11: tema escuro e mobile continuam legíveis (capturas em test-results/)
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(PAGE, { waitUntil: "load" });
    await expect(card).toBeVisible();
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
    await page.screenshot({ path: "test-results/drive-integration-dark.png", fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PAGE, { waitUntil: "load" });
    await expect(card).toBeVisible();
    await expect(connect).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await page.screenshot({ path: "test-results/drive-integration-mobile.png", fullPage: true });
  });
});
