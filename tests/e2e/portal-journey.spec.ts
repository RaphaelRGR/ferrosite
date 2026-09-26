import { expect as baseExpect, test, type Page } from "@playwright/test";

// Server Actions contra a nuvem com o runner cheio: asserções esperam mais que o padrão de 5 s.
const expect = baseExpect.configure({ timeout: 30_000 });

/**
 * Jornada autenticada de ponta a ponta contra o Supabase real (após db:push):
 * projeto → equipe → missão (transições, checklist, comentário) → arquivo →
 * conteúdo (revisão → aprovação → publicação → site → despublicação) →
 * empresa/desafio → relatórios. Uma única conta admin; roda em série.
 * Dados criados levam sufixo único e ficam no banco (não há DELETE por design).
 */
test.describe("jornada autenticada no Portal", () => {
  test.describe.configure({ mode: "serial" });
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD para o fluxo autenticado");
  test.setTimeout(120_000);

  const run = Date.now().toString(36);
  const projectName = `Projeto E2E ${run}`;
  const projectSlug = `projeto-e2e-${run}`;
  const missionTitle = `Missão E2E ${run}`;
  const newsSlug = `noticia-e2e-${run}`;
  const newsTitle = `Notícia E2E ${run}`;

  const reviewer = { email: process.env.E2E_REVIEWER_EMAIL, password: process.env.E2E_REVIEWER_PASSWORD };

  async function login(page: Page, user = email!, pass = password!) {
    await page.goto("/login?next=/portal", { waitUntil: "load" });
    await page.getByLabel("E-mail").first().fill(user);
    await page.getByLabel("Senha").fill(pass);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/portal");
    await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Entrar no Portal");
  }
  async function logout(page: Page) {
    await page.getByRole("banner").getByRole("button", { name: "Sair" }).click();
    await page.waitForURL("**/login");
  }
  const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Salvo." }).first()).toBeVisible();

  test("projeto: criar (rascunho), editar com versão, mover para ativo, histórico", async ({ page }) => {
    await login(page);
    await page.goto("/portal/projetos/novo", { waitUntil: "load" });
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill(projectName);
    await page.getByLabel(/Identificador/).fill(projectSlug);
    await page.getByRole("textbox", { name: "Resumo", exact: true }).fill("Projeto criado pelo teste de ponta a ponta.");
    await page.getByRole("button", { name: "Criar" }).click();
    await page.waitForURL(`**/portal/projetos/${projectSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(projectName);
    await expect(page.getByText("Rascunho", { exact: true }).first()).toBeVisible();

    // transição rascunho → ativo por botão (servidor valida)
    await page.getByRole("button", { name: "Mover para Ativo" }).click();
    await saved(page);
    await expect(page.getByText("Ativo", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("mudou a situação do projeto")).toBeAttached();

    // edição com versão
    await page.goto(`/portal/projetos/${projectSlug}/editar`, { waitUntil: "load" });
    await page.getByRole("textbox", { name: "Resumo", exact: true }).fill("Resumo editado.");
    await page.getByRole("button", { name: "Salvar" }).click();
    await saved(page);
  });

  test("missão: criar, avançar no fluxo, checklist e comentário; Kanban e calendário mostram a mesma missão", async ({ page }) => {
    await login(page);
    await page.goto(`/portal/projetos/${projectSlug}/missoes/nova`, { waitUntil: "load" });
    await page.getByRole("textbox", { name: "Título", exact: true }).fill(missionTitle);
    await page.getByLabel(/Prazo/).fill("2030-12-31T10:00");
    await page.getByRole("button", { name: "Criar" }).click();
    await page.waitForURL(/\/portal\/projetos\/.*\/missoes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 2, name: missionTitle })).toBeVisible();
    await expect(page.getByText("criou a missão")).toBeAttached();

    await page.getByRole("button", { name: "Mover para Em execução" }).click();
    await saved(page);
    await expect(page.getByText("Em execução", { exact: true }).first()).toBeVisible();
    // membro comum não valida; admin (overseer) pode ir a validação e concluir
    await page.getByRole("button", { name: "Mover para Em validação" }).click();
    await saved(page);
    await page.getByRole("button", { name: "Mover para Concluída" }).click();
    await saved(page);
    await expect(page.getByText("Concluída", { exact: true }).first()).toBeVisible();

    await page.getByRole("textbox", { name: "Item", exact: true }).fill("Entregável 1");
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await expect(page.getByRole("checkbox", { name: "Entregável 1" })).toBeAttached();
    await page.getByRole("textbox", { name: "Comentar" }).fill("Comentário do teste.");
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(page.getByText("Comentário do teste.")).toBeAttached();

    await page.goto(`/portal/projetos/${projectSlug}/missoes?vista=kanban`, { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 3, name: missionTitle })).toBeAttached();
    await page.goto(`/portal/projetos/${projectSlug}/missoes?vista=calendario&situacao=all`, { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 3, name: missionTitle })).toBeAttached();
  });

  test("equipe: adicionar por e-mail cadastrado; e-mail desconhecido é rejeitado sem vazar", async ({ page }) => {
    await login(page);
    await page.goto(`/portal/projetos/${projectSlug}/equipe`, { waitUntil: "load" });
    await page.getByLabel("E-mail cadastrado").fill("ninguem@ferrosite.test");
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByRole("alert").first()).toContainText("Registro não encontrado");
    await page.getByLabel("E-mail cadastrado").fill(email!);
    await page.getByRole("button", { name: "Adicionar" }).click();
    await saved(page);
    await expect(page.getByText(email!).first()).toBeAttached();
  });

  test("arquivo: registro exige tipo da allowlist; consentimento editável", async ({ page }) => {
    await login(page);
    await page.goto("/portal/arquivos/novo", { waitUntil: "load" });
    await page.getByRole("textbox", { name: "ID no provedor" }).fill(`drive-e2e-${run}`);
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill(`foto-e2e-${run}.jpg`);
    await page.getByLabel("Consentimento", { exact: true }).selectOption("granted");
    await page.getByRole("button", { name: "Registrar arquivo" }).click();
    await page.waitForURL(/\/portal\/arquivos\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`foto-e2e-${run}.jpg`);
    // sem credencial do Drive: pendência declarada; com Drive conectado (DRIVE-002): bloco de acesso com verificação
    await expect(page.getByText("[CONTEÚDO PENDENTE]").or(page.getByRole("button", { name: "Verificar no Drive" })).first()).toBeAttached();
  });

  test("conteúdo: rascunho invisível no site; autor não aprova; revisor aprova e publica → site; despublicar → some", async ({ page }) => {
    test.skip(!reviewer.email || !reviewer.password, "defina E2E_REVIEWER_EMAIL/E2E_REVIEWER_PASSWORD (conta de coordenação) para a aprovação por terceiro");
    await login(page);
    await page.goto("/portal/conteudos/novo", { waitUntil: "load" });
    await page.getByLabel(/Identificador/).fill(newsSlug);
    await page.getByRole("textbox", { name: "Título", exact: true }).fill(newsTitle);
    await page.getByRole("textbox", { name: "Resumo", exact: true }).fill("Resumo publicado pelo teste.");
    await page.getByLabel(/Texto \(Markdown/).fill("## Seção\n\nTexto **forte** <script>alert(1)</script> [link](https://ufsc.br)");
    await page.getByRole("button", { name: "Criar" }).click();
    await page.waitForURL(/\/portal\/conteudos\/[0-9a-f-]{36}$/);
    const itemUrl = page.url();
    await expect(page.getByText("Rascunho", { exact: true }).first()).toBeVisible();

    // rascunho não aparece no site
    const draft = await page.request.get(`/pt/noticias/${newsSlug}`);
    expect(draft.status()).toBe(404);

    await page.getByRole("button", { name: "Mover para Em revisão" }).click();
    await saved(page);
    // o próprio autor (admin) não aprova: o servidor recusa
    await page.getByRole("button", { name: "Mover para Aprovado" }).click();
    await expect(page.getByRole("alert").first()).toContainText("autor não aprova");
    // pré-visualização por token funciona antes da publicação
    const previewHref = await page.getByRole("link", { name: "Pré-visualizar" }).getAttribute("href");
    const preview = await page.request.get(previewHref!);
    expect(preview.status()).toBe(200);
    expect(await preview.text()).toContain("Pré-visualização");
    expect(await preview.text()).not.toContain("<script>alert(1)</script>");

    // revisor (coordenação) aprova e publica; snapshot vai para a projeção e o site
    await logout(page);
    await login(page, reviewer.email, reviewer.password);
    await page.goto(itemUrl, { waitUntil: "load" });
    await page.getByRole("button", { name: "Mover para Aprovado" }).click();
    await saved(page);
    await expect(page.getByText("Aprovado", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Publicar agora" }).click();
    await saved(page);
    await expect(page.getByText("Publicado", { exact: true }).first()).toBeVisible();

    await page.goto(`/pt/noticias/${newsSlug}`, { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(newsTitle);
    await expect(page.locator('[data-published="live"]')).toHaveCount(1);
    await expect(page.locator('[data-content-status="unverified"]')).toHaveCount(0); // aprovado: sem selo
    await expect(page.locator("main strong", { hasText: "forte" })).toBeAttached();
    expect(await page.locator("main").innerHTML()).not.toContain("<script>alert(1)</script>");
    await page.goto("/pt/noticias", { waitUntil: "load" });
    await expect(page.getByText("Publicadas pelo Portal")).toBeAttached();
    await expect(page.getByText(newsTitle)).toBeAttached();

    // despublicar (motivo obrigatório) some do site e mantém histórico
    await page.goto(itemUrl, { waitUntil: "load" });
    await page.getByRole("textbox", { name: "Motivo da despublicação" }).fill("Teste de despublicação.");
    await page.getByRole("button", { name: "Despublicar" }).click();
    await saved(page);
    await expect(page.getByText("Despublicado", { exact: true }).first()).toBeVisible();
    const gone = await page.request.get(`/pt/noticias/${newsSlug}`);
    expect(gone.status()).toBe(404);
    await expect(page.getByText(/Despublicado em/)).toBeAttached();
  });

  test("empresa e desafio: organização, contato, interação, pipeline com motivo; triagem de desafio recebido pelo site", async ({ page }) => {
    await login(page);
    await page.goto("/portal/empresas/nova", { waitUntil: "load" });
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill(`Empresa E2E ${run}`);
    await page.getByRole("button", { name: "Criar" }).click();
    await page.waitForURL(/\/portal\/empresas\/[0-9a-f-]{36}$/);
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Contato E2E");
    await page.getByRole("button", { name: "Adicionar contato" }).click();
    await saved(page);
    await page.getByRole("textbox", { name: "Resumo", exact: true }).fill("Reunião inicial de teste.");
    await page.getByRole("button", { name: "Registrar interação" }).click();
    await expect(page.getByText("Reunião inicial de teste.")).toBeAttached();
    // perdido sem motivo é recusado pelo servidor
    await page.getByLabel("Etapa da parceria").selectOption("lost");
    await page.getByRole("button", { name: "Salvar" }).last().click();
    await expect(page.getByRole("alert").first()).toContainText("Verifique os campos");

    // desafio enviado pelo site público chega restrito com protocolo
    await page.goto("/pt/para-empresas/desafio", { waitUntil: "load" });
    await page.getByLabel("Organização").fill(`Empresa E2E ${run}`);
    await page.getByLabel("Seu nome").fill("Pessoa E2E");
    await page.getByLabel("E-mail para retorno").fill(`desafio-${run}@ferrosite.test`);
    await page.getByLabel("Título do desafio").fill("Desgaste prematuro de rodas em curvas");
    await page.getByLabel("Descrição do problema").fill("Descrição longa o suficiente do problema técnico para a triagem da coordenação.");
    await page.getByLabel(/Material Rodante/).check();
    await page.getByLabel(/Autorizo o uso destes dados/).check();
    await page.locator('input[name="startedAt"]').evaluate((el) => ((el as HTMLInputElement).value = String(Date.now() - 10_000)));
    await page.getByRole("button", { name: "Enviar desafio" }).click();
    // O limite anti-spam do banco (5/h por origem) é real e vale para esta máquina: falhar rápido e explicar,
    // em vez de esperar o protocolo até o timeout.
    // (o Next mantém um role="alert" vazio para anunciar rotas: só alertas com texto contam)
    const alert = page.getByRole("alert").filter({ hasText: /\S/ });
    await expect(page.getByTestId("protocol").or(alert).first()).toBeVisible();
    if (await alert.count()) throw new Error(`envio recusado (provavelmente limite de 5/h por origem no banco; aguarde 1 h): ${await alert.first().innerText()}`);
    const protocol = await page.getByTestId("protocol").innerText();
    expect(protocol).toMatch(/^DES-\d{4}-\d{6}$/);

    await page.goto("/portal/desafios?situacao=received", { waitUntil: "load" });
    await page.getByRole("link", { name: new RegExp(protocol) }).click();
    await expect(page.getByText("Desgaste prematuro de rodas em curvas").first()).toBeVisible();
    await expect(page.getByText("LMSE").first()).toBeAttached(); // lab relacionado por capacidade
    await page.getByLabel("Situação", { exact: true }).selectOption("screening");
    await page.getByRole("button", { name: "Salvar" }).click();
    await saved(page);
    await expect(page.getByText("Em triagem", { exact: true }).first()).toBeVisible();
  });

  test("relatórios: indicadores com fonte, 'sem dados' onde não há fonte, snapshot e CSV auditado", async ({ page }) => {
    await login(page);
    await page.goto("/portal/relatorios", { waitUntil: "load" });
    await expect(page.getByRole("row", { name: /Projetos ativos/ })).toBeAttached();
    await expect(page.getByRole("row", { name: /Visitas realizadas/ })).toContainText("sem dados");
    await page.getByRole("button", { name: "Gerar snapshot" }).click();
    await saved(page);
    const exportHref = await page.getByRole("link", { name: "Exportar CSV" }).first().getAttribute("href");
    const csv = await page.request.get(exportHref!);
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toMatch(/text\/csv/);
    expect(await csv.text()).toContain("Projetos ativos");
    // Início de admin/coordenação é a Minha mesa; os números canônicos ficam no Panorama da Central (ACT-001)
    await page.goto("/portal", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "Precisa de você" })).toBeVisible();
    await page.goto("/portal/coordenacao", { waitUntil: "load" });
    await expect(page.getByText("Desafios aguardando triagem")).toBeAttached();
  });

  test("e-mails (MAIL-001): fila alimentada pelo banco aparece em Configurações; envio manual auditado; sem provedor nada se perde", async ({ page }) => {
    await login(page);
    await page.goto("/portal/configuracoes", { waitUntil: "load" });
    const section = page.getByRole("region", { name: "E-mails" });
    await expect(section).toBeVisible();
    // desafio, revisão, aprovação, publicação e ingresso nas etapas anteriores enfileiraram linhas
    const queued = Number(await section.locator("dl > div").filter({ hasText: "Na fila" }).locator("dd").first().innerText());
    expect(queued).toBeGreaterThan(0);
    await section.getByRole("button", { name: "Enviar pendentes agora" }).click();
    await expect(section.getByRole("status")).toContainText(/Reservados \d+; enviados \d+/);
    // endpoint de cron não existe sem segredo configurado (fail-closed)
    const res = await page.request.post("/api/mail/dispatch", { headers: { Authorization: "Bearer x" } });
    expect(res.status()).toBe(404);
    // OPS-002: sink de erros — evento de teste auditado, mesmo sem webhook configurado
    const obs = page.getByRole("region", { name: "Observabilidade" });
    await expect(obs).toBeVisible();
    await obs.getByRole("button", { name: "Enviar evento de teste" }).click();
    await expect(obs.getByRole("status")).toContainText(/Contadores do processo|nenhum webhook configurado/);
  });
});
