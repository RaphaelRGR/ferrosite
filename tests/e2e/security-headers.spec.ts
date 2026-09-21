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

test("mídia e arquivos (DRIVE-001): tudo fecha sem sessão ou sem credencial; nunca redireciona ao provedor", async ({ request }) => {
  const id = "00000000-0000-4000-8000-000000000000";
  // público: id desconhecido ou provedor não configurado ⇒ 404 idêntico (sem distinguir motivo)
  const media = await request.get(`/api/midia/${id}`, { maxRedirects: 0 });
  expect(media.status()).toBe(404);
  expect(media.headers()["location"]).toBeUndefined();
  expect((await request.get("/api/midia/nao-e-uuid")).status()).toBe(404);
  // Portal: sem sessão o proxy de autenticação manda para /login antes de qualquer byte
  for (const path of [`/portal/arquivos/${id}/original`, `/portal/arquivos/${id}/miniatura`]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/login\?next=/);
  }
  const health = await (await request.get("/api/health")).json();
  expect(typeof health.driveConfigured).toBe("boolean");
});

test("telemetria do navegador (OPS-002): aceita só o contrato, sem eco, com limite", async ({ request }) => {
  const ok = await request.post("/api/telemetry", { data: { scope: "public", name: "TypeError", message: "e2e", digest: "d", path: "/pt" } });
  expect(ok.status()).toBe(204);
  expect(await ok.text()).toBe("");
  expect((await request.post("/api/telemetry", { data: { scope: "admin", name: "x", message: "y" } })).status()).toBe(400);
  expect((await request.post("/api/telemetry", { data: "nao-json", headers: { "Content-Type": "text/plain" } })).status()).toBe(400);
  expect((await request.post("/api/telemetry", { data: { scope: "public", name: "x", message: "y".repeat(5000) } })).status()).toBe(400);
  const health = await (await request.get("/api/health")).json();
  expect(typeof health.errorSinkConfigured).toBe("boolean");
});
