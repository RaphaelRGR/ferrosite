import { expect, test, type Page } from "@playwright/test";

/**
 * ACT-004: processo a partir do modelo "Visita técnica" (todas as ações por
 * etapa, prazos a partir da data, checklist de EPI, relatório com aprovação),
 * resumo do dia na Minha mesa e resumo da semana na Central, com texto para
 * copiar. Cancela no fim as ações criadas.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const reviewer = { email: process.env.E2E_REVIEWER_EMAIL, password: process.env.E2E_REVIEWER_PASSWORD };

test.describe("processos e resumos", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!admin.email || !admin.password || !reviewer.email || !reviewer.password, "defina E2E_ADMIN_* e E2E_REVIEWER_*");
  test.setTimeout(240_000);

  const run = Date.now().toString(36);
  const title = `Visita técnica E2E ${run}`;
  let processUrl = "";
  let reviewerName = "";

  async function login(page: Page, email: string, password: string) {
    await page.goto("/login?next=/portal", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((u) => u.pathname === "/portal");
    await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
  }

  test("processo de visita técnica cria as ações por etapa", async ({ page }) => {
    await login(page, reviewer.email!, reviewer.password!);
    reviewerName = ((await page.locator("header span[title]").first().textContent()) ?? "").split(" · ")[0].trim();
    await page.context().clearCookies();
    await login(page, admin.email!, admin.password!);

    await page.goto("/portal/acoes", { waitUntil: "load" });
    await page.getByRole("link", { name: "Processos" }).click();
    await page.getByRole("link", { name: "Usar este modelo" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Visita técnica" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ações que serão criadas" })).toBeVisible();
    await expect(page.getByText("7 dias antes").first()).toBeVisible();

    const date = new Date(Date.now() + 60 * 24 * 3600_000).toISOString().slice(0, 10);
    await page.getByLabel("Nome do processo").fill(title);
    await page.getByLabel("Data da visita").fill(date);
    await page.getByLabel("Quem aprova o relatório").selectOption({ label: reviewerName });
    await page.getByRole("button", { name: "Criar processo" }).click();
    await page.waitForURL(/\/portal\/acoes\/processos\/[0-9a-f-]{36}$/);
    processUrl = new URL(page.url()).pathname;

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.locator("[data-process-progress]")).toHaveAttribute("data-process-progress", /^0\/\d+$/);
    for (const phase of ["Planejamento", "Participantes", "Segurança", "Logística", "Empresa", "Execução", "Pós-visita", "Encerramento"]) {
      await expect(page.getByRole("heading", { name: new RegExp(`^${phase}`) })).toBeVisible();
    }

    // ação de EPI com checklist e ligação de volta ao processo
    await page.getByRole("link", { name: "Verificar EPI dos participantes" }).click();
    await expect(page.locator("section[aria-labelledby='checklist']").getByText("0 de 3 passos")).toBeVisible();
    await expect(page.locator("aside dl").getByRole("link", { name: title })).toBeVisible();

    // relatório já com aprovador
    await page.goto(processUrl, { waitUntil: "load" });
    await page.getByRole("link", { name: "Relatório da visita" }).click();
    await expect(page.locator("aside dl")).toContainText(reviewerName);
  });

  test("resumo do dia na Minha mesa e resumo da semana na Central, com texto para copiar", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await expect(page.getByRole("heading", { name: "Resumo do dia" })).toBeVisible();
    await expect(page.locator("[data-daily-summary]")).not.toBeEmpty();
    await expect(page.getByRole("button", { name: "Copiar resumo" })).toBeVisible();

    await page.goto("/portal/coordenacao", { waitUntil: "load" });
    const weekly = page.locator("section[aria-labelledby='resumo-semana']");
    await expect(weekly.getByRole("heading", { name: "Resumo da semana" })).toBeVisible();
    await expect(weekly.locator("[data-weekly-stats]")).toContainText("novas");
    await expect(weekly.getByRole("button", { name: "Copiar para enviar" })).toBeVisible();
  });

  test("limpeza: cancela as ações do processo de teste", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto(processUrl, { waitUntil: "load" });
    const hrefs = await page.locator("[data-work-item] > div > a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(20);
    for (const h of hrefs) {
      await page.goto(h, { waitUntil: "load" });
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await expect(page.getByText("Cancelada").first()).toBeVisible();
    }
    await page.goto(processUrl, { waitUntil: "load" });
    await expect(page.locator("[data-process-progress]")).toHaveAttribute("data-process-progress", "0/0");
  });
});
