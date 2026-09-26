import { expect, test, type Page } from "@playwright/test";

/**
 * ACT-002: Entrada (item sem responsável → organizar), Lembrar depois (some
 * até a data; volta com "Trazer de volta"), Bloqueios (resumo por quem
 * esperamos) e decisão com opções. Cancela no fim o que criou.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const reviewer = { email: process.env.E2E_REVIEWER_EMAIL, password: process.env.E2E_REVIEWER_PASSWORD };

test.describe("Entrada, lembrar depois, bloqueios e decisão com opções", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!admin.email || !admin.password || !reviewer.email || !reviewer.password, "defina E2E_ADMIN_* e E2E_REVIEWER_*");
  test.setTimeout(120_000);

  const run = Date.now().toString(36);
  const inboxTitle = `Entrada E2E ${run}`;
  const decisionTitle = `Decisão E2E ${run}`;
  const names = { reviewer: "" };
  const urls = { inbox: "", decision: "" };

  async function login(page: Page, email: string, password: string) {
    await page.goto("/login?next=/portal", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((u) => u.pathname === "/portal");
    await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
  }
  const openCreate = async (page: Page) => {
    await page.getByRole("button", { name: "Nova ação", exact: true }).click();
    return page.getByRole("dialog", { name: "Nova ação" });
  };
  const timeline = (page: Page) => page.locator("section[aria-labelledby='atividade']");

  test("nome da coordenação", async ({ page }) => {
    await login(page, reviewer.email!, reviewer.password!);
    names.reviewer = ((await page.locator("header span[title]").first().textContent()) ?? "").split(" · ")[0].trim();
    expect(names.reviewer).toBeTruthy();
  });

  test("item sem responsável vai para a Entrada e é organizado dali", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    const dialog = await openCreate(page);
    await dialog.getByLabel("O que precisa acontecer?").fill(inboxTitle);
    await dialog.getByLabel("Responsável").selectOption({ label: "Ninguém ainda (vai para a Entrada)" });
    await dialog.getByText("Sem prazo", { exact: true }).click();
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Ação criada.");
    await page.keyboard.press("Escape");

    // Minha mesa avisa; a aba Entrada mostra o item com o formulário de organizar
    await page.reload({ waitUntil: "load" });
    await expect(page.getByRole("link", { name: /Na Entrada: \d+ para organizar/ })).toBeVisible();
    await page.goto("/portal/acoes?aba=entrada", { waitUntil: "load" });
    const row = page.locator("[data-inbox-item]").filter({ hasText: inboxTitle });
    await expect(row).toHaveCount(1);
    await row.getByLabel("Quando?").selectOption("tomorrow");
    await row.getByRole("button", { name: "Aceitar" }).click();
    await expect(page.locator("[data-inbox-item]").filter({ hasText: inboxTitle })).toHaveCount(0);

    await page.goto("/portal/acoes?aba=abertas", { waitUntil: "load" });
    await page.getByRole("link", { name: inboxTitle }).click();
    await page.waitForURL(/\/portal\/acoes\/[0-9a-f-]{36}$/);
    urls.inbox = new URL(page.url()).pathname;
    await expect(page.getByText("Planejada").first()).toBeVisible();
    await expect(page.getByText(/Amanhã · 18:00/)).toBeVisible();
  });

  test("lembrar depois tira das listas até a data; trazer de volta desfaz", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto(urls.inbox, { waitUntil: "load" });
    await page.getByLabel("Lembrar depois").selectOption("next_week");
    await page.getByRole("button", { name: "Adiar" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Adiado até/ })).toBeVisible();

    await page.goto("/portal/acoes?aba=abertas", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: inboxTitle })).toHaveCount(0);
    await page.goto("/portal/acoes?aba=adiadas", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: inboxTitle })).toBeVisible();

    await page.goto(urls.inbox, { waitUntil: "load" });
    await page.getByRole("button", { name: "Trazer de volta" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Adiado até/ })).toHaveCount(0);
    await expect(timeline(page).locator("[data-event='snoozed']")).toHaveCount(1);
    await expect(timeline(page).locator("[data-event='unsnoozed']")).toHaveCount(1);
  });

  test("bloqueios mostram por quem estamos esperando", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto(urls.inbox, { waitUntil: "load" });
    await page.getByRole("button", { name: "Aguardando…" }).click();
    await page.getByLabel("Aguardando quem?").selectOption({ label: "Fornecedor" });
    await page.getByRole("button", { name: "Marcar como aguardando" }).click();
    await expect(page.getByText(/Aguardando: Fornecedor/).first()).toBeVisible();

    await page.goto("/portal/acoes?aba=bloqueios", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /\d+ ações paradas/ })).toBeVisible();
    await page.getByRole("link", { name: /^Fornecedor \d+$/ }).click();
    await expect(page.locator("#aguardando-supplier").getByRole("link", { name: inboxTitle })).toBeVisible();
  });

  test("decisão com opções: a coordenação escolhe e fica registrado", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    const dialog = await openCreate(page);
    await dialog.getByLabel("O que precisa acontecer?").fill(decisionTitle);
    await dialog.getByLabel("Responsável").selectOption({ label: names.reviewer });
    await dialog.getByText("Mais opções").click();
    await dialog.getByLabel("Tipo").selectOption("decision");
    await dialog.getByLabel("Opções (uma por linha)").fill("12 OUT\n19 OUT");
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await dialog.getByRole("link", { name: "Abrir" }).click();
    await page.waitForURL(/\/portal\/acoes\/[0-9a-f-]{36}$/);
    urls.decision = new URL(page.url()).pathname;
    await expect(page.locator("aside dl")).toContainText("12 OUT · 19 OUT");

    await page.context().clearCookies();
    await login(page, reviewer.email!, reviewer.password!);
    await page.goto(urls.decision, { waitUntil: "load" });
    await page.getByLabel("19 OUT").check();
    await page.getByRole("button", { name: "Registrar decisão" }).click();
    await expect(page.getByText("Decisão: 19 OUT")).toBeVisible();
    await expect(page.getByText(new RegExp(`Decidido por ${names.reviewer} em`))).toBeVisible();
    await expect(page.getByText("Concluída").first()).toBeVisible();
  });

  test("arquivar direto da Entrada (item sem responsável)", async ({ page }) => {
    const title = `Ideia solta E2E ${run}`;
    await login(page, admin.email!, admin.password!);
    const dialog = await openCreate(page);
    await dialog.getByLabel("O que precisa acontecer?").fill(title);
    await dialog.getByLabel("Responsável").selectOption({ label: "Ninguém ainda (vai para a Entrada)" });
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Ação criada.");
    await page.goto("/portal/acoes?aba=entrada", { waitUntil: "load" });
    const row = page.locator("[data-inbox-item]").filter({ hasText: title });
    await row.getByRole("button", { name: "Arquivar" }).click();
    await expect(page.locator("[data-inbox-item]").filter({ hasText: title })).toHaveCount(0);
    await page.goto("/portal/acoes?aba=concluidas", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("limpeza: cancela o item de teste que ficou aberto", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto(urls.inbox, { waitUntil: "load" });
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Cancelada").first()).toBeVisible();
  });
});
