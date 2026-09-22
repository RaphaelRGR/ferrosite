import { expect, test } from "@playwright/test";

/**
 * Aviso de privacidade (21, 35): existe, é alcançável de qualquer página,
 * descreve o tratamento real e deixa explícito o que ainda depende de decisão
 * institucional — sem prometer o que não foi aprovado.
 */
test("/pt/privacidade: assuntos obrigatórios, pendências marcadas e link externo seguro", async ({ page }) => {
  await page.goto("/pt/privacidade", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacidade e dados");

  for (const titulo of ["Cookies", "Vídeos do YouTube", "Fotos de pessoas", "Desafios enviados por empresas", "Contas do Portal", "Onde os dados ficam", "Seus direitos", "Por quanto tempo guardamos", "Responsável e contato"]) {
    await expect(page.getByRole("heading", { level: 2, name: titulo })).toBeVisible();
  }

  // o que depende da UFSC não é inventado
  await expect(page.locator("[data-privacy-pending]")).toContainText("[CONTEÚDO PENDENTE]");
  await expect(page.getByText("[CONTEÚDO PENDENTE]").first()).toBeVisible();

  const google = page.getByRole("link", { name: /Política de privacidade do Google/ });
  await expect(google).toHaveAttribute("href", "https://policies.google.com/privacy");
  await expect(google).toHaveAttribute("rel", "noopener");

  // data de revisão legível por máquina
  await expect(page.locator("time[datetime]").first()).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
});

test("o rodapé leva à privacidade em qualquer página pública e a rota entra no sitemap", async ({ page }) => {
  for (const path of ["/pt", "/pt/curso", "/pt/para-empresas"]) {
    await page.goto(path, { waitUntil: "load" });
    await expect(page.locator('footer a[href="/pt/privacidade"]')).toHaveCount(1);
  }
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/pt/privacidade");
  expect(sitemap).toContain("/en/privacidade");
});

test("o formulário de desafio aponta para a política antes do envio", async ({ page }) => {
  await page.goto("/pt/para-empresas/desafio", { waitUntil: "load" });
  const link = page.getByRole("link", { name: "Como tratamos esses dados" });
  await expect(link).toHaveAttribute("href", "/pt/privacidade");
});

test("/en/privacidade declara pendência de tradução em vez de cair no PT", async ({ page }) => {
  await page.goto("/en/privacidade", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1, name: "Page in preparation" })).toBeVisible();
  await expect(page.getByText("Cookies", { exact: false })).toHaveCount(0);
});
