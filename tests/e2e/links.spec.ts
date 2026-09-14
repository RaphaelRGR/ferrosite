import { expect, test } from "@playwright/test";
import known from "./known-broken-links.json";
import { crawlInternalLinks } from "../helpers/crawl";
import { HTML_ROUTES } from "../helpers/routes";

/**
 * Inventário de links internos. Enquanto as rotas alvo não existem, os links
 * quebrados conhecidos ficam listados em known-broken-links.json; qualquer
 * diferença (novo quebrado ou conhecido corrigido) falha o teste para forçar
 * atualização consciente da lista.
 */
test("links e fragmentos internos quebrados correspondem exatamente à lista conhecida", async ({ page, request }, testInfo) => {
  test.setTimeout(120_000);
  const inventory = await crawlInternalLinks(page, request, HTML_ROUTES);

  await testInfo.attach("links-inventory.json", {
    body: JSON.stringify(inventory, null, 2),
    contentType: "application/json",
  });

  expect(inventory.brokenPaths).toEqual([...known.brokenPaths].sort());
  expect(inventory.brokenFragments).toEqual([...known.brokenFragments].sort());
});
