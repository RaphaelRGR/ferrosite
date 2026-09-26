import { expect, test } from "@playwright/test";

/**
 * PUBLIC-002: hubs claros sem ações falsas. Filtro de Experiências é estado de
 * URL (funciona sem JS), Eventos nasce vazio e honesto, Notícias sem paginação/
 * newsletter falsas, detalhes com pendência explícita.
 */
test("experiências: filtro por escopo via URL altera a lista e é compartilhável", async ({ page }) => {
  await page.goto("/pt/experiencias", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Da sala de aula para o mundo real");
  // contador do bloco do protótipo (as publicadas têm filtros e contadores próprios acima)
  const escopo = page.getByRole("navigation", { name: "Filtrar por escopo" });
  await expect(escopo.getByText(/^\d+ experiências$/)).toHaveText("6 experiências");

  await escopo.getByRole("link", { name: "Internacional" }).click();
  await page.waitForURL("**/pt/experiencias?escopo=internacional");
  await expect(page.getByRole("navigation", { name: "Filtrar por escopo" }).getByText(/^\d+ experiências$/)).toHaveText("1 experiências");
  await expect(page.getByRole("link", { name: "Internacional", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("UTN, Buenos Aires")).toBeAttached();
  await expect(page.getByText("Oficinas da MRS")).toHaveCount(0);

  // sem período de inscrição: texto honesto, nenhum botão/form de inscrição
  await expect(page.getByText(/Não há período de inscrição aberto/)).toBeAttached();
  await expect(page.locator("form")).toHaveCount(0);
});

test("experiência: detalhe declara o que está pendente e volta ao hub", async ({ page }) => {
  await page.goto("/pt/experiencias/visitas.gallery.rumo-2023", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("CCO Rumo Logística");
  await expect(page.getByText(/Roteiro público, aprendizados/)).toBeAttached();
  await page.getByRole("link", { name: /Todas as experiências/ }).click();
  await page.waitForURL("**/pt/experiencias");
});

test("eventos: agenda vazia e honesta, sem filtros ou inscrições falsas", async ({ page }) => {
  await page.goto("/pt/eventos", { waitUntil: "load" });
  await expect(page.getByText("Nenhum evento publicado ainda")).toBeAttached();
  await expect(page.locator("main button")).toHaveCount(0);
  await expect(page.locator("main form")).toHaveCount(0);
});

test("notícias: sem paginação/newsletter falsas; detalhe sem autor inventado", async ({ page }) => {
  await page.goto("/pt/noticias", { waitUntil: "load" });
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.getByText(/Carregar mais/)).toHaveCount(0);
  await expect(page.getByText(/A newsletter entra no ar quando houver provedor/)).toBeAttached();
  await page.getByRole("link", { name: "Ler notícia" }).first().click();
  await page.waitForURL("**/pt/noticias/**");
  await expect(page.getByText(/Texto completo, autor, crédito/)).toBeAttached();
  await expect(page.getByText("Raphael Garcia")).toHaveCount(0);
});

test("sobre: linha do tempo sem nomes de pessoas e com selos de verificação", async ({ page }) => {
  await page.goto("/pt/sobre", { waitUntil: "load" });
  await expect(page.getByText("Marcos Imhof")).toHaveCount(0);
  await expect(page.getByText("Primeira turma formada")).toBeAttached();
  await expect(page.locator('[data-content-status="unverified"]')).toHaveCount(3);
});

test("nenhuma página pública tem botões sem ação (31)", async ({ page }) => {
  for (const route of ["/pt", "/pt/curso", "/pt/projetos", "/pt/experiencias", "/pt/noticias", "/pt/sobre", "/pt/eventos", "/pt/laboratorios", "/pt/laboratorios/lav", "/pt/para-empresas"]) {
    await page.goto(route, { waitUntil: "load" });
    const dead = await page.locator("main button").evaluateAll((els) =>
      els.filter((el) => {
        const b = el as HTMLButtonElement;
        // botão sem handler React, fora de form e sem aria-pressed/expanded/haspopup é suspeito
        const keys = Object.keys(b).filter((k) => k.startsWith("__reactProps"));
        const props = keys.length ? ((b as unknown as Record<string, Record<string, unknown>>)[keys[0]] ?? {}) : {};
        const hasHandler = Object.keys(props).some((k) => k.startsWith("on"));
        return !hasHandler && b.type !== "submit" && !b.hasAttribute("aria-pressed") && !b.hasAttribute("aria-haspopup");
      }).map((el) => (el as HTMLElement).innerText.trim()),
    );
    expect(dead, route).toEqual([]);
  }
});
