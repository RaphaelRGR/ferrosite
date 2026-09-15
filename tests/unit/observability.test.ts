import { describe, expect, it, vi } from "vitest";
import { logEvent, redact } from "@/lib/observability/log";

/** OPS-001 (21): logs sem token/senha/cookie; valores longos cortados; uma linha JSON por evento. */
describe("redact", () => {
  it("redige chaves sensíveis em qualquer profundidade e preserva o resto", () => {
    const out = redact({ user: "u", password: "x", nested: { Authorization: "Bearer t", SUPABASE_SERVICE_ROLE_KEY: "k", ok: 1 }, list: [{ cookie: "c" }] }) as Record<string, unknown>;
    expect(out.password).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).Authorization).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).SUPABASE_SERVICE_ROLE_KEY).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).ok).toBe(1);
    expect((out.list as Array<Record<string, unknown>>)[0].cookie).toBe("[redacted]");
    expect(out.user).toBe("u");
  });

  it("corta strings longas e serializa erros sem stack em produção", () => {
    expect(String(redact("a".repeat(600)))).toMatch(/…\[600\]$/);
    const e = redact(new Error("boom")) as Record<string, unknown>;
    expect(e.message).toBe("boom");
  });
});

describe("logEvent", () => {
  it("emite uma linha JSON com ts/level/event e campos redigidos", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logEvent("info", "test.event", { requestId: "r1", token: "secret" });
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line.level).toBe("info");
    expect(line.event).toBe("test.event");
    expect(line.requestId).toBe("r1");
    expect(line.token).toBe("[redacted]");
    expect(line.ts).toMatch(/^\d{4}-/);
    spy.mockRestore();
  });
});
