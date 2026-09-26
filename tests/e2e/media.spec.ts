import { expect, test } from "@playwright/test";
import { COURSE_SHORTS } from "../../src/content/videos";

/**
 * Orçamento de imagem (22 e critério "galeria não carrega originais em massa"):
 * página nenhuma pede o arquivo original do Drive para exibir em lista, capa ou
 * grade — só larguras da lista permitida. O original fica atrás do clique.
 */
const PAGES = ["/pt", "/pt/experiencias/visita-tecnica-rumo-2026", "/pt/projetos"];
const MAX_IMAGE_KB = 300;

for (const path of PAGES) {
  test(`${path}: imagens só em larguras pedidas e nenhuma acima de ${MAX_IMAGE_KB} KB`, async ({ page }) => {
    const semLargura: string[] = [];
    const pesadas: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (!u.pathname.startsWith("/api/midia/")) return;
      if (!u.searchParams.get("w")) semLargura.push(u.pathname);
    });
    page.on("response", async (r) => {
      if (!(r.headers()["content-type"] ?? "").startsWith("image/")) return;
      const len = Number(r.headers()["content-length"] ?? 0);
      if (len > MAX_IMAGE_KB * 1024) pesadas.push(`${r.url()} (${Math.round(len / 1024)} KB)`);
    });

    await page.goto(path, { waitUntil: "load" });
    // rola até o fim para disparar todo o lazy-load da página
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(1500);

    expect(semLargura, "pedido do arquivo original numa lista/galeria").toEqual([]);
    expect(pesadas, "imagem acima do orçamento").toEqual([]);
  });
}

test("a rota de mídia recusa largura fora da lista e o lightbox abre a foto grande", async ({ page }) => {
  await page.goto("/pt/experiencias/visita-tecnica-rumo-2026", { waitUntil: "load" });
  const grade = page.locator("[data-gallery-count] a");
  const href = await grade.first().getAttribute("href");
  expect(href).toMatch(/^\/api\/midia\/[0-9a-f-]{36}\?w=1600$/); // sem JS, o link leva à foto grande
  const id = href!.split("/").pop()!.split("?")[0];
  expect((await page.request.get(`/api/midia/${id}?w=999`)).status()).toBe(400);
  expect((await page.request.get(`/api/midia/${id}?w=480`)).status()).toBe(200);

  await grade.first().click();
  const foto = page.locator('dialog[aria-label="Galeria"] img');
  // a foto grande vem do Drive pelo proxy: com a máquina carregada pode passar de 5 s
  await expect(foto).toBeVisible({ timeout: 20_000 });
  await expect(foto).toHaveAttribute("src", /\?w=(960|1280|1600)$/);
});

/**
 * A Home sorteia um Short por visita; o teste por página só vê o sorteado. Aqui
 * cada miniatura passa pelo otimizador na maior largura que o site pede (640 px,
 * a 2x do cartão de 320 px), para o orçamento valer para todos, sem depender do
 * sorteio. O original do YouTube (oar2.jpg) chega a 380 KB.
 */
test(`miniaturas dos Shorts pelo otimizador ficam abaixo de ${MAX_IMAGE_KB} KB`, async ({ page }) => {
  for (const id of COURSE_SHORTS) {
    const url = encodeURIComponent(`https://i.ytimg.com/vi/${id}/oar2.jpg`);
    const res = await page.request.get(`/_next/image?url=${url}&w=640&q=75`, { headers: { accept: "image/webp,image/*" } });
    expect(res.status(), id).toBe(200);
    expect(res.headers()["content-type"], id).toBe("image/webp");
    expect((await res.body()).length, id).toBeLessThan(MAX_IMAGE_KB * 1024);
  }
});
