import { expect, test } from "@playwright/test";

/**
 * Shorts do curso (YouTube): um vídeo por vez, sorteado no cliente; fachada sem
 * terceiros até o clique; player só do youtube-nocookie e permitido pela CSP.
 */
test("/pt/curso: um Short por vez, YouTube só depois do clique, 'Outro vídeo' troca e fecha o player", async ({ page }) => {
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    const host = new URL(r.url()).host;
    if (/youtube\.com|youtube-nocookie\.com|googlevideo\.com|doubleclick/.test(host)) thirdParty.push(r.url());
  });
  await page.goto("/pt/curso", { waitUntil: "load" });
  const strip = page.locator("[data-shorts]").first();
  const play = strip.getByRole("button", { name: /^Assistir: / });
  await expect(play).toHaveCount(1);
  await expect(strip.locator("iframe")).toHaveCount(0);
  expect(thirdParty.filter((u) => !u.includes("i.ytimg.com"))).toEqual([]);

  const firstTitle = await play.getAttribute("aria-label");
  await play.click();
  const frame = strip.locator("iframe");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?/);
  await expect(frame).toHaveAttribute("title", /\S/);
  const csp = (await (await page.request.get("/pt/curso")).headers())["content-security-policy"];
  expect(csp).toMatch(/frame-src https:\/\/www\.youtube-nocookie\.com/);
  expect(csp).toMatch(/img-src [^;]*https:\/\/i\.ytimg\.com/);

  await strip.getByRole("button", { name: "Outro vídeo" }).click();
  await expect(strip.locator("iframe")).toHaveCount(0);
  await expect(play).toHaveCount(1);
  expect(await play.getAttribute("aria-label")).not.toBe(firstTitle);
});

test("/pt: a Home mostra um Short com título real e link para o YouTube", async ({ page }) => {
  await page.goto("/pt", { waitUntil: "load" });
  const strip = page.locator("[data-shorts]").first();
  await expect(strip.getByRole("button", { name: /^Assistir: / })).toHaveCount(1);
  const link = strip.getByRole("link", { name: /Ver no YouTube/ });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", /^https:\/\/www\.youtube\.com\/shorts\/[A-Za-z0-9_-]{11}$/);
  await expect(link).toHaveAttribute("rel", "noopener");
});
