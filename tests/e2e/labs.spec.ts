import { expect, test } from "@playwright/test";

/**
 * LAB-001: hub por capacidade (estado de URL), páginas de laboratório com
 * potencial distinguido de capacidade, pendências não inventadas, nenhum
 * contato pessoal publicado e Para Empresas sem formulário/e-mail falso.
 */
const CONTACT = /@|\+55 ?\d|\(\d{2}\) ?\d{4,5}-\d{4}|Lattes|Sala [A-Z0-9?]/;

test("laboratórios: filtro por capacidade via URL, com nível por texto (não só cor)", async ({ page }) => {
  await page.goto("/pt/laboratorios", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Capacidades de pesquisa para o setor ferroviário e metroviário");
  await expect(page.getByText(/^\d+ laboratórios$/)).toHaveText("14 laboratórios");
  await expect(page.getByRole("link", { name: "Ver laboratório" })).toHaveCount(14);

  await page.getByRole("navigation", { name: "Filtrar por capacidade" }).getByRole("link", { name: "Via Permanente", exact: true }).click();
  await page.waitForURL("**/pt/laboratorios?capacidade=via-permanente");
  await expect(page.getByRole("link", { name: "Via Permanente", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/^\d+ laboratórios$/)).toHaveText("5 laboratórios");
  // LDTPav entra só como potencial: selo com asterisco e texto acessível
  const ldtpav = page.locator("li", { hasText: "LDTPav" }).first();
  await expect(ldtpav.getByText("Via Permanente*")).toBeAttached();
  await expect(ldtpav.getByText("Potencial de aplicação")).toHaveCount(2); // via permanente + geotecnia

  // capacidade sem lab detalhado: estado vazio com saída
  await page.goto("/pt/laboratorios?capacidade=logistica", { waitUntil: "load" });
  await expect(page.getByText("Nenhum laboratório detalhado para esta capacidade ainda.")).toBeAttached();
  await expect(page.getByRole("link", { name: "Todas as capacidades" })).toHaveCount(2);

  // parâmetro inválido cai no "todas"
  await page.goto("/pt/laboratorios?capacidade=logos", { waitUntil: "load" });
  await expect(page.getByText(/^\d+ laboratórios$/)).toHaveText("14 laboratórios");
});

test("laboratório detalhado: seções do portfólio, capacidades e nada de contato", async ({ page }) => {
  await page.goto("/pt/laboratorios/ldtpav", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laboratório de Desenvolvimento e Tecnologia em Pavimentação");
  await expect(page.getByText(/Responsável informado no portfólio/)).toBeAttached();
  for (const h of ["O laboratório", "Histórico e projetos", "Aplicações no setor ferroviário e metroviário", "Capacidades", "Campos pendentes de validação"]) {
    await expect(page.getByRole("heading", { name: h, exact: true })).toBeAttached();
  }
  // todas as 3 aplicações do LDTPav são prospectivas no PDF
  await expect(page.getByText("Potencial de aplicação", { exact: true })).toHaveCount(3);
  await expect(page.getByText(/Fonte: portfólio de laboratórios .* página 13\./)).toBeAttached();
  expect(await page.locator("main").innerText()).not.toMatch(CONTACT);

  // capacidade leva ao hub filtrado
  await page.getByRole("link", { name: /^Materiais/ }).click();
  await page.waitForURL("**/pt/laboratorios?capacidade=materiais");
});

test("robótica: conteúdo duplicado no PDF vira pendência com link, não texto copiado", async ({ page }) => {
  await page.goto("/pt/laboratorios/robotica", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laboratório de Robótica Avançada");
  await expect(page.getByText(/texto desta página é idêntico ao do LabDSE/)).toBeAttached();
  await expect(page.getByRole("heading", { name: "O laboratório" })).toHaveCount(0);
  await expect(page.getByText("Engenharia de Sistemas para o desenvolvimento")).toHaveCount(0);
  await page.getByRole("link", { name: "Ver LabDSE" }).click();
  await page.waitForURL("**/pt/laboratorios/labdse");
});

test("laboratório só no índice: pendência explícita, sem responsável ou conteúdo inventado", async ({ page }) => {
  await page.goto("/pt/laboratorios/lasc", { waitUntil: "load" });
  await expect(page.getByText(/aparece apenas no índice do portfólio/)).toBeAttached();
  await expect(page.getByText(/Responsável informado/)).toHaveCount(0);
  await expect(page.getByText("Automação", { exact: true })).toHaveCount(0); // só o selo "Automação — Área inferida…"
  await expect(page.getByText("Área inferida do nome")).toHaveCount(2);
  await page.goto("/pt/laboratorios/nao-existe", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/Automação/);
});

test("para empresas: começa pelo problema, sem formulário nem e-mail inventado", async ({ page }) => {
  await page.goto("/pt/para-empresas", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Que problema sua empresa precisa resolver?");
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.getByText("[CONTEÚDO PENDENTE]").first()).toBeAttached();
  await expect(page.getByText(/não são prometidos automaticamente/)).toBeAttached();
  expect(await page.locator("main").innerText()).not.toMatch(CONTACT);
  await expect(page.getByRole("link", { name: /^Ruído/ })).toContainText("2 com capacidade descrita");
  await expect(page.getByRole("link", { name: /^Automação/ })).toContainText("1 sem página detalhada");
  await expect(page.getByRole("link", { name: /^Logística/ })).toContainText("Ainda sem laboratório detalhado");
  await page.getByRole("link", { name: /^Ruído/ }).click();
  await page.waitForURL("**/pt/laboratorios?capacidade=ruido");
  await expect(page.getByText(/^\d+ laboratórios$/)).toHaveText("2 laboratórios");
});

test("curso: cards de laboratório levam à página do laboratório", async ({ page }) => {
  await page.goto("/pt/curso", { waitUntil: "load" });
  await page.getByRole("link", { name: /^LMSE/ }).click();
  await page.waitForURL("**/pt/laboratorios/lmse");
});

test("EN: laboratórios e empresas mostram pendência por idioma, sem PT como fallback", async ({ page }) => {
  for (const route of ["/en/laboratorios", "/en/laboratorios/lav", "/en/para-empresas"]) {
    await page.goto(route, { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page in preparation");
    await expect(page.getByText("Responsável informado")).toHaveCount(0);
  }
});
