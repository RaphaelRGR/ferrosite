import { expect, test } from "@playwright/test";

/**
 * Compartilhamento (critério "canonical/hreflang/sitemap/OG corretos"): toda
 * página pública declara uma imagem de compartilhamento que existe de verdade;
 * páginas com capa usam a foto da publicação, as demais o cartão do locale.
 */
const PAGES = ["/pt", "/pt/curso", "/pt/projetos", "/pt/projetos/vigia", "/pt/experiencias", "/pt/experiencias/visita-tecnica-rumo-2026", "/pt/para-empresas", "/en", "/en/curso"];

const meta = (html: string, prop: string) => html.match(new RegExp(`<meta property="${prop}" content="([^"]+)"`))?.[1] ?? "";

for (const path of PAGES) {
  test(`${path}: og:image aponta para uma imagem que responde`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    const url = meta(html, "og:image");
    expect(url, "og:image ausente").toMatch(/^https?:\/\//); // absoluta (metadataBase)
    expect(meta(html, "og:title"), "og:title ausente").not.toBe("");
    expect(html).toContain('name="twitter:card" content="summary_large_image"');

    // A URL é absoluta contra o metadataBase (domínio público), mas quem responde aqui
    // é o servidor de teste: busca pelo caminho, no baseURL da suíte.
    const { pathname, search } = new URL(url);
    const res = await request.get(pathname + search);
    expect(res.status(), url).toBe(200);
    expect(res.headers()["content-type"], url).toMatch(/^image\//);
  });
}

test("cartão do locale: 1200x630 em PT e EN; locale inexistente não gera cartão", async ({ request }) => {
  for (const l of ["pt", "en"]) {
    const res = await request.get(`/og/${l}`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const png = await res.body();
    // cabeçalho PNG: largura e altura são big-endian nos bytes 16..24
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }
  expect((await request.get("/og/xx", { maxRedirects: 0 })).status()).toBe(404);
});

test("a Home e a experiência publicada compartilham a própria foto", async ({ request }) => {
  for (const path of ["/pt", "/pt/experiencias/visita-tecnica-rumo-2026"]) {
    const html = await (await request.get(path)).text();
    expect(meta(html, "og:image"), path).toMatch(/\/api\/midia\/[0-9a-f-]{36}\?w=1280$/);
    expect(meta(html, "og:image:alt"), `${path}: alt`).not.toBe("");
  }
  // robots não bloqueia a foto que representa a página
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /api/midia/");
});
