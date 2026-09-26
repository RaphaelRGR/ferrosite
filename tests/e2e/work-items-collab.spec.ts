import { expect, test, type Page } from "@playwright/test";

/**
 * ACT-003: ação criada dentro do projeto (vínculo preenchido), checklist,
 * responsável de fora da coordenação (vê só o próprio item, com os nomes de
 * quem atuou), menção que aparece na Minha mesa até a pessoa responder.
 * Cancela no fim o que criou.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const member = { email: process.env.E2E_MEMBER_EMAIL, password: process.env.E2E_MEMBER_PASSWORD };

test.describe("checklist, menções e responsáveis de qualquer papel", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!admin.email || !admin.password || !member.email || !member.password, "defina E2E_ADMIN_* e E2E_MEMBER_*");
  test.setTimeout(120_000);

  const run = Date.now().toString(36);
  const projectItem = `Ação do projeto E2E ${run}`;
  const memberItem = `Enviar fotos E2E ${run}`;
  const names = { admin: "", member: "" };
  const urls = { project: "", member: "" };

  async function login(page: Page, email: string, password: string) {
    await page.goto("/login?next=/portal", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((u) => u.pathname === "/portal");
    await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
  }
  const displayName = async (page: Page) => ((await page.locator("header span[title]").first().textContent()) ?? "").split(" · ")[0].trim();
  const timeline = (page: Page) => page.locator("section[aria-labelledby='atividade']");

  test("nomes das contas", async ({ page }) => {
    await login(page, member.email!, member.password!);
    names.member = await displayName(page);
    await page.context().clearCookies();
    await login(page, admin.email!, admin.password!);
    names.admin = await displayName(page);
    expect(names.admin && names.member).toBeTruthy();
  });

  test("ação criada dentro do projeto já nasce ligada a ele; checklist com progresso e histórico", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.goto("/portal/projetos", { waitUntil: "load" });
    const projectLink = page.locator('a[href^="/portal/projetos/"]:not([href$="/novo"])').first();
    await projectLink.click();
    await page.waitForURL(/\/portal\/projetos\/[a-z0-9-]+$/);
    const projectPath = new URL(page.url()).pathname;
    const projectName = ((await page.getByRole("heading", { level: 1 }).textContent()) ?? "").trim();

    await page.getByRole("button", { name: "Nova ação neste projeto" }).click();
    const dialog = page.getByRole("dialog", { name: "Nova ação" });
    await dialog.getByLabel("O que precisa acontecer?").fill(projectItem);
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Ação criada.");
    await dialog.getByRole("link", { name: "Abrir" }).click();
    await page.waitForURL(/\/portal\/acoes\/[0-9a-f-]{36}$/);
    urls.project = new URL(page.url()).pathname;
    await expect(page.locator("aside dl")).toContainText(projectName);

    const checklist = page.locator("section[aria-labelledby='checklist']");
    for (const step of ["Conferir inscritos", "Gerar PDF"]) {
      await checklist.getByLabel("Adicionar passo").fill(step);
      await checklist.getByRole("button", { name: "Adicionar passo" }).click();
      await expect(checklist.getByText(step)).toBeVisible();
    }
    await checklist.getByRole("checkbox", { name: "Conferir inscritos" }).click();
    await expect(checklist.getByText("1 de 2 passos")).toBeVisible();
    await expect(timeline(page).locator("[data-event='checklist_done']")).toHaveCount(1);

    // aparece no bloco "Ações" do projeto
    await page.goto(projectPath, { waitUntil: "load" });
    await expect(page.locator("section[aria-labelledby='acoes-project']").getByRole("link", { name: projectItem })).toBeVisible();
  });

  test("responsável de fora da coordenação: recebe, vê nomes, marca passo e menciona", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    await page.getByRole("button", { name: "Nova ação", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Nova ação" });
    await dialog.getByLabel("O que precisa acontecer?").fill(memberItem);
    await dialog.getByLabel("Responsável").selectOption({ label: `${names.member} · Membro` });
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await dialog.getByRole("link", { name: "Abrir" }).click();
    await page.waitForURL(/\/portal\/acoes\/[0-9a-f-]{36}$/);
    urls.member = new URL(page.url()).pathname;
    const checklist = page.locator("section[aria-labelledby='checklist']");
    await checklist.getByLabel("Adicionar passo").fill("Selecionar 10 fotos");
    await checklist.getByRole("button", { name: "Adicionar passo" }).click();
    await expect(checklist.getByText("Selecionar 10 fotos")).toBeVisible();

    await page.context().clearCookies();
    await login(page, member.email!, member.password!);
    await expect(page.locator("section[aria-labelledby='acoes-com-voce']").getByRole("link", { name: memberItem })).toBeVisible();
    await page.goto(urls.member, { waitUntil: "load" });
    // nomes de quem atuou aparecem mesmo sem dividir projeto com a administração
    await expect(timeline(page).locator("[data-event='created']")).toContainText(names.admin);
    await page.locator("section[aria-labelledby='checklist']").getByRole("checkbox", { name: "Selecionar 10 fotos" }).click();
    await expect(page.getByText("1 de 1 passos")).toBeVisible();
    // não edita dados nem vê a lista geral
    await expect(page.getByText("Editar dados")).toHaveCount(0);

    await page.getByLabel("Comentário").fill("Fotos selecionadas, pode conferir?");
    await page.getByLabel(names.admin, { exact: true }).check();
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(timeline(page).getByText(`@${names.admin}`)).toBeVisible();
  });

  test("menção aparece na Minha mesa até a pessoa responder", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    const mentions = page.locator("section[aria-labelledby='mencoes']");
    await expect(mentions.getByRole("link", { name: `${names.member} em ${memberItem}` })).toBeVisible();
    await mentions.getByRole("link", { name: `${names.member} em ${memberItem}` }).click();
    await page.getByLabel("Comentário").fill("Conferido, obrigado!");
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(timeline(page).getByText("Conferido, obrigado!")).toBeVisible();
    await page.goto("/portal", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: `${names.member} em ${memberItem}` })).toHaveCount(0);
  });

  test("limpeza: cancela as ações de teste", async ({ page }) => {
    await login(page, admin.email!, admin.password!);
    for (const url of [urls.project, urls.member]) {
      await page.goto(url, { waitUntil: "load" });
      await page.getByRole("button", { name: "Cancelar" }).click();
      await expect(page.getByText("Cancelada").first()).toBeVisible();
    }
  });
});
