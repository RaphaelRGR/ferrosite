import { expect, test, type Page } from "@playwright/test";

/**
 * ACT-001 (critérios 1-20 do pedido): administração cria ação em segundos com
 * responsável e prazo, marca "aguardando quem", comenta, vincula arquivo e
 * pede aprovação; a coordenação vê o que depende dela, pede alteração e
 * aprova; a coordenação também pede uma ação à administração; o histórico
 * registra tudo; conta comum não acessa nada disso.
 * Cria dados no Supabase configurado (como o resto do e2e) e cancela o que
 * sobra aberto no fim.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const reviewer = { email: process.env.E2E_REVIEWER_EMAIL, password: process.env.E2E_REVIEWER_PASSWORD };
const member = { email: process.env.E2E_MEMBER_EMAIL, password: process.env.E2E_MEMBER_PASSWORD };
const NOT_FOUND = "Página não encontrada no Portal";

test.describe("ações da administração e da coordenação", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!admin.email || !admin.password || !reviewer.email || !reviewer.password, "defina E2E_ADMIN_* e E2E_REVIEWER_* (conta de coordenação)");
  test.setTimeout(120_000);

  const run = Date.now().toString(36);
  const reportTitle = `Relatório E2E ${run}`;
  const requestTitle = `Pedido da coordenação E2E ${run}`;
  const names = { admin: "", reviewer: "" };
  let reportUrl = "";

  async function login(page: Page, email: string, password: string) {
    await page.goto("/login?next=/portal", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((u) => u.pathname === "/portal");
    await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
  }
  /** Nome como o Portal o exibe (cabeçalho: "Nome · Papel"). */
  const displayName = async (page: Page) => ((await page.locator("header span[title]").first().textContent()) ?? "").split(" · ")[0].trim();

  async function quickCreate(page: Page, title: string, opts: { owner?: string; approver?: string; when?: string }) {
    await page.getByRole("button", { name: "Nova ação", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Nova ação" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("O que precisa acontecer?").fill(title);
    if (opts.owner) await dialog.getByLabel("Responsável").selectOption({ label: opts.owner });
    await dialog.getByText(opts.when ?? "Amanhã", { exact: true }).click();
    if (opts.approver) {
      await dialog.getByText("Mais opções").click();
      await dialog.getByLabel("Quem aprova").selectOption({ label: opts.approver });
    }
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Ação criada.");
    await dialog.getByRole("link", { name: "Abrir" }).click();
    await page.waitForURL(/\/portal\/acoes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
  const timeline = (page: Page) => page.locator("section[aria-labelledby='atividade']");

  test("nomes das contas de teste", async ({ page }) => {
    await login(page, reviewer.email!, reviewer.password!);
    names.reviewer = await displayName(page);
    await page.context().clearCookies();
    await login(page, admin.email!, admin.password!);
    names.admin = await displayName(page);
    expect(names.admin && names.reviewer).toBeTruthy();
  });

  test("administração: Minha mesa, criação rápida, aguardando, comentário, arquivo e pedido de aprovação", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await expect(page.getByText("Minha mesa").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Precisa de você" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Ações", exact: true }).first()).toBeVisible();

    await quickCreate(page, reportTitle, { approver: `${names.reviewer}` });
    reportUrl = new URL(page.url()).pathname;
    await expect(page.getByText("Planejada").first()).toBeVisible();
    await expect(page.getByText(/Amanhã · \d{2}:\d{2}/)).toBeVisible();
    // item com aprovador não conclui direto
    await expect(page.getByRole("button", { name: "Concluir" })).toHaveCount(0);

    // aguardando quem
    await page.getByRole("button", { name: "Aguardando…" }).click();
    await page.getByLabel("Aguardando quem?").selectOption({ label: "Empresa" });
    await page.getByLabel("Detalhe (opcional)").fill("Rumo confirmar a lista");
    await page.getByRole("button", { name: "Marcar como aguardando" }).click();
    await expect(page.getByText(/Aguardando: Empresa · Rumo confirmar a lista · desde/).first()).toBeVisible();

    // comentário
    await page.getByLabel("Comentário").fill("A Rumo pediu a lista até amanhã.");
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(timeline(page).getByText("A Rumo pediu a lista até amanhã.")).toBeVisible();

    // arquivo do Drive já registrado no Portal
    const fileSelect = page.getByLabel("Vincular arquivo que já está no Portal");
    if (await fileSelect.count()) {
      await fileSelect.selectOption({ index: 0 });
      await page.getByRole("button", { name: "Vincular", exact: true }).click();
      await expect(timeline(page).locator("[data-event='file_linked']")).toHaveCount(1);
      await expect(page.locator("section[aria-labelledby='arquivos'] a[href$='/original']")).toHaveCount(1);
    }

    await page.getByRole("button", { name: "Retomar" }).click();
    await expect(page.getByText("Em execução").first()).toBeVisible();
    await page.getByRole("button", { name: "Pedir aprovação" }).click();
    await expect(page.getByRole("status").filter({ hasText: `Aguardando aprovação de ${names.reviewer}` })).toBeVisible();

    // aparece na Minha mesa, em "Aguardando aprovação"
    await page.goto("/portal", { waitUntil: "load" });
    await expect(page.locator("section[aria-labelledby='t-aprovacao']").getByRole("link", { name: reportTitle })).toBeVisible();
  });

  test("coordenação: vê o que depende dela, pede alteração e pede uma ação à administração", async ({ page }) => {
    await login(page, reviewer.email!, reviewer.password!);
    await expect(page.locator("section[aria-labelledby='t-com-voce']").getByRole("link", { name: reportTitle })).toBeVisible();

    await page.goto("/portal/coordenacao", { waitUntil: "load" });
    await expect(page.locator("section[aria-labelledby='atencao']").getByRole("link", { name: reportTitle })).toBeVisible();

    await page.goto(reportUrl, { waitUntil: "load" });
    await expect(page.getByRole("status").filter({ hasText: "pediu sua aprovação" })).toBeVisible();
    await page.getByRole("button", { name: "Solicitar alterações" }).click();
    await page.getByLabel("O que precisa ser ajustado?").fill("Incluir a lista de presença.");
    await page.getByRole("button", { name: "Enviar pedido de alteração" }).click();
    await expect(page.getByText("Em execução").first()).toBeVisible();
    await expect(timeline(page).getByText("Incluir a lista de presença.")).toBeVisible();

    await quickCreate(page, requestTitle, { owner: names.admin, when: "Hoje" });
    await expect(page.locator("aside dl")).toContainText(names.admin);
  });

  test("administração reenvia; coordenação aprova; histórico completo", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await expect(page.getByRole("link", { name: requestTitle }).first()).toBeVisible(); // pedido da coordenação na Minha mesa
    await page.goto(reportUrl, { waitUntil: "load" });
    await page.getByRole("button", { name: "Pedir aprovação" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Aguardando aprovação de" })).toBeVisible();
    // o dono não aprova a própria entrega
    await expect(page.getByRole("button", { name: "Aprovar" })).toHaveCount(0);

    await page.context().clearCookies();
    await login(page, reviewer.email!, reviewer.password!);
    await page.goto(reportUrl, { waitUntil: "load" });
    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Concluída").first()).toBeVisible();
    await expect(page.getByText(new RegExp(`Aprovado por ${names.reviewer} em`))).toBeVisible();

    const events = await timeline(page).locator("[data-timeline='event']").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.event));
    for (const e of ["created", "waiting", "approval_requested", "changes_requested", "approved"]) expect(events).toContain(e);
  });

  test("limpeza: cancela o pedido de teste que ficou aberto", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.getByRole("link", { name: requestTitle }).first().click();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Cancelada").first()).toBeVisible();
  });
});

test("conta comum não vê Ações nem a Central, nem por link direto", async ({ page }) => {
  test.skip(!member.email || !member.password, "defina E2E_MEMBER_EMAIL/E2E_MEMBER_PASSWORD (conta member ativa)");
  await page.goto("/login?next=/portal", { waitUntil: "load" });
  await page.getByLabel("E-mail").first().fill(member.email!);
  await page.getByLabel("Senha").fill(member.password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => u.pathname === "/portal");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Ações", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nova ação", exact: true })).toHaveCount(0);
  for (const path of ["/portal/acoes", "/portal/coordenacao", "/portal/acoes/00000000-0000-0000-0000-000000000000"]) {
    await page.goto(path, { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND })).toBeVisible();
  }
});
