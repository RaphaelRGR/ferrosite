import { expect, test, type Page } from "@playwright/test";

/**
 * Central da coordenação (COORD-001): só admin/coordenação; cada alerta exibe
 * regra, evidência e próxima ação; as seções do panorama existem mesmo sem dados.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const member = { email: process.env.E2E_MEMBER_EMAIL, password: process.env.E2E_MEMBER_PASSWORD };
const NOT_FOUND = "Página não encontrada no Portal";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login?next=/portal", { waitUntil: "load" });
  await page.getByLabel("E-mail").first().fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => u.pathname === "/portal");
  await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
}

test("admin vê a Central: panorama, fila com regra/evidência/ação, agenda, indicadores e regras", async ({ page }) => {
  test.skip(!admin.email || !admin.password, "defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD");
  await login(page, admin.email!, admin.password!);

  // atalho no Início e item no menu
  await page.getByRole("link", { name: /Abrir a Central da coordenação/ }).click();
  await page.waitForURL("**/portal/coordenacao");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Coordenação" }).first()).toHaveAttribute("aria-current", "page");

  await expect(page.getByRole("heading", { level: 1, name: "Central da coordenação" })).toBeVisible();
  for (const name of ["Panorama", /Fila de decisões/, "Agenda dos próximos 60 dias", "Indicadores dos últimos 90 dias", "Ações rápidas", "Como os alertas funcionam"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Projetos ativos/ })).toHaveAttribute("href", "/portal/projetos?situacao=active");

  // Cada grupo da fila explica a regra e cada item tem evidência e botão de ação com destino interno.
  const groups = page.locator("section[data-rule]");
  const count = await groups.count();
  for (let i = 0; i < count; i++) {
    const g = groups.nth(i);
    await expect(g.getByText(/^Regra:/)).toBeVisible();
    const items = g.locator("li");
    const n = await items.count();
    for (let j = 0; j < n; j++) {
      await expect(items.nth(j).getByText(/\((hoje|há \d+ dias?)\)/)).toBeVisible();
      await expect(items.nth(j).getByRole("link").last()).toHaveAttribute("href", /^\/portal\//);
    }
  }
  if (count === 0) await expect(page.getByText("Nenhum alerta agora")).toBeVisible();

  // Todas as regras aparecem explicadas, com o limiar em dias quando houver.
  await expect(page.getByText(/Projetos sem atualização:.*há 30 dias ou mais/)).toBeVisible();
});

test("conta sem papel de coordenação não acessa nem vê o item de menu", async ({ page }) => {
  test.skip(!member.email || !member.password, "defina E2E_MEMBER_EMAIL/E2E_MEMBER_PASSWORD (conta member ativa)");
  await login(page, member.email!, member.password!);
  await expect(page.getByRole("link", { name: "Coordenação" })).toHaveCount(0);
  // O layout do Portal faz streaming: notFound() chega como a tela de "não encontrado" (status já enviado).
  await page.goto("/portal/coordenacao", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1, name: "Central da coordenação" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND })).toBeVisible();
  await expect(page.getByText("Fila de decisões")).toHaveCount(0);
});
