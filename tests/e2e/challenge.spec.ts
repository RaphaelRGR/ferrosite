import { expect, test } from "@playwright/test";

/**
 * CRM-001: formulário público "Tenho um desafio" — consentimento obrigatório,
 * honeypot fora do fluxo, anti-bot por tempo mínimo, confirmação só com
 * protocolo. Sem banco migrado na nuvem, o envio válido responde com erro
 * textual (nunca com dados ecoados); com banco, devolve DES-AAAA-NNNNNN.
 */
async function fill(page: import("@playwright/test").Page) {
  await page.getByLabel("Organização").fill("ACME Ferrovias");
  await page.getByLabel("Seu nome").fill("Pessoa de Teste");
  await page.getByLabel("E-mail para retorno").fill("e2e-desafio@ferrosite.test");
  await page.getByLabel("Título do desafio").fill("Desgaste prematuro de rodas em curvas");
  await page.getByLabel("Descrição do problema").fill("Descrição longa o suficiente do problema técnico para a triagem da coordenação.");
  await page.getByLabel(/Material Rodante/).check();
  await page.getByLabel(/Autorizo o uso destes dados/).check();
}

test("para empresas leva ao formulário; consentimento é obrigatório e honeypot fica fora da tabulação", async ({ page }) => {
  await page.goto("/pt/para-empresas", { waitUntil: "load" });
  await page.getByRole("link", { name: "Tenho um desafio" }).click();
  await page.waitForURL("**/pt/para-empresas/desafio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tenho um desafio");
  await expect(page.locator("main form")).toHaveCount(1);
  await expect(page.getByLabel(/Autorizo o uso destes dados/)).toHaveAttribute("required", "");
  const honey = page.locator('input[name="website"]');
  await expect(honey).toHaveAttribute("tabindex", "-1");
  await expect(honey).not.toBeInViewport();
  await expect(page.getByText(/\[CONTEÚDO PENDENTE\]/)).toBeAttached(); // retenção ainda sem decisão
  await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
});

test("envio rápido demais é tratado como automatizado; envio válido nunca ecoa os dados", async ({ page }) => {
  await page.goto("/pt/para-empresas/desafio", { waitUntil: "load" });
  await fill(page);
  // Carimbo de início "agora": simula envio em menos de 3 s, independentemente da carga da máquina.
  await page.locator('input[name="startedAt"]').evaluate((el) => ((el as HTMLInputElement).value = String(Date.now())));
  await page.getByRole("button", { name: "Enviar desafio" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Verifique os campos/ })).toBeVisible();

  // Os valores digitados foram preservados (React 19 limparia o form); só o consentimento precisa ser refeito.
  await expect(page.getByLabel("Organização")).toHaveValue("ACME Ferrovias");
  await expect(page.getByLabel(/Material Rodante/)).toBeChecked();
  await page.getByLabel(/Autorizo o uso destes dados/).check();

  // Após o tempo mínimo: com banco migrado vem protocolo; sem banco, erro textual. Nunca os dados enviados.
  await page.locator('input[name="startedAt"]').evaluate((el) => ((el as HTMLInputElement).value = String(Date.now() - 10_000)));
  await page.getByRole("button", { name: "Enviar desafio" }).click();
  const protocol = page.getByTestId("protocol");
  const alert = page.getByRole("alert").filter({ hasText: /indisponível|Não foi possível|Limite/ });
  await expect(protocol.or(alert).first()).toBeVisible({ timeout: 15_000 });
  if (await protocol.count()) {
    await expect(protocol).toHaveText(/^DES-\d{4}-\d{6}$/);
    await expect(page.getByText("ACME Ferrovias")).toHaveCount(0);
    await expect(page.getByText("e2e-desafio@ferrosite.test")).toHaveCount(0);
  }
});

test("EN: formulário disponível (interface, não conteúdo editorial)", async ({ page }) => {
  await page.goto("/en/para-empresas/desafio", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I have a challenge");
  await expect(page.locator("main form")).toHaveCount(1);
});
