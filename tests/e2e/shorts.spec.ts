import { expect, test } from "@playwright/test";

/**
 * Shorts do curso (YouTube): sorteio no cliente, fachada sem terceiros até o
 * clique, player só do youtube-nocookie e permitido pela CSP.
 */
test("/pt/curso: faixa de Shorts sorteia 4 vídeos e só carrega o YouTube ao clicar", async ({ page }) => {
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    const host = new URL(r.url()).host;
    if (/youtube\.com|youtube-nocookie\.com|googlevideo\.com|doubleclick/.test(host)) thirdParty.push(r.url());
  });
  await page.goto("/pt/curso", { waitUntil: "load" });
  const strip = page.locator("[data-shorts]").first();
  await expect(strip.locator("ul")).toHaveAttribute("aria-busy", "false");
  await expect(strip.locator("li")).toHaveCount(4);
  await expect(strip.locator("iframe")).toHaveCount(0);
  // antes do clique nada vai para o YouTube (só miniaturas do i.ytimg.com)
  expect(thirdParty.filter((u) => !u.includes("i.ytimg.com"))).toEqual([]);

  await strip.getByRole("button", { name: /^Assistir: / }).first().click();
  const frame = strip.locator("iframe");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?/);
  await expect(frame).toHaveAttribute("title", /\S/);
  // CSP publicada permite exatamente essas origens
  const csp = (await (await page.request.get("/pt/curso")).headers())["content-security-policy"];
  expect(csp).toMatch(/frame-src https:\/\/www\.youtube-nocookie\.com/);
  expect(csp).toMatch(/img-src [^;]*https:\/\/i\.ytimg\.com/);

  // "Outros vídeos" refaz o sorteio e fecha o player
  await strip.getByRole("button", { name: "Outros vídeos" }).click();
  await expect(strip.locator("iframe")).toHaveCount(0);
  await expect(strip.locator("li")).toHaveCount(4);
});

test("/pt: a Home mostra 3 Shorts com título real e link para o YouTube", async ({ page }) => {
  await page.goto("/pt", { waitUntil: "load" });
  const strip = page.locator("[data-shorts]").first();
  await expect(strip.locator("li")).toHaveCount(3);
  await expect(strip.getByRole("link", { name: /Ver no YouTube/ })).toHaveCount(3);
  const first = strip.getByRole("link", { name: /Ver no YouTube/ }).first();
  await expect(first).toHaveAttribute("href", /^https:\/\/www\.youtube\.com\/shorts\/[A-Za-z0-9_-]{11}$/);
  await expect(first).toHaveAttribute("rel", "noopener");
});
