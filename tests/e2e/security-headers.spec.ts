import { expect, test } from "@playwright/test";

/** OPS-001 (21): cabeçalhos de segurança em todas as respostas; Portal/API sem cache; health sem segredos. */
test("cabeçalhos de segurança no site público e no Portal", async ({ request }) => {
  for (const path of ["/pt", "/login", "/pt/laboratorios"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    const h = res.headers();
    expect(h["content-security-policy"], path).toMatch(/default-src 'self'/);
    expect(h["content-security-policy"], path).toMatch(/frame-ancestors 'none'/);
    expect(h["content-security-policy"], path).toMatch(/object-src 'none'/);
    expect(h["content-security-policy"], path).not.toMatch(/unsafe-eval/);
    expect(h["x-content-type-options"], path).toBe("nosniff");
    expect(h["x-frame-options"], path).toBe("DENY");
    expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"], path).toMatch(/camera=\(\)/);
    expect(h["x-powered-by"], path).toBeUndefined();
  }
  const portal = await request.get("/portal", { maxRedirects: 0 });
  expect(portal.headers()["cache-control"]).toMatch(/no-store/);
});

test("health: vivo, sem segredos, sem cache", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toMatch(/no-store/);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(typeof body.supabaseConfigured).toBe("boolean");
  expect(JSON.stringify(body)).not.toMatch(/eyJ|sb_|service_role/);
});
