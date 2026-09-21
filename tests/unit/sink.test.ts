import { afterEach, describe, expect, it, vi } from "vitest";
import { allowClientReport, isBodyTooLarge, parseClientReport } from "@/lib/observability/client-report";
import { logEvent } from "@/lib/observability/log";
import { createWebhookSink, getErrorSink, readSinkEnv, resetErrorSink, shouldForward } from "@/lib/observability/sink";

const cfg = { url: "https://coletor.invalid/ingest", token: "tok", minLevel: "error" as const };
const ev = (level = "error", extra: Record<string, unknown> = {}) => ({ ts: "2026-09-21T00:00:00.000Z", level, event: "x", ...extra });

describe("sink de erros (OPS-002)", () => {
  afterEach(() => {
    resetErrorSink();
    vi.restoreAllMocks();
  });

  it("só https configura; nível padrão error, opcional warn", () => {
    expect(readSinkEnv({} as NodeJS.ProcessEnv)).toBeNull();
    expect(readSinkEnv({ ERROR_SINK_URL: "http://x.invalid" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(readSinkEnv({ ERROR_SINK_URL: "https://x.invalid/a", ERROR_SINK_TOKEN: "t", ERROR_SINK_LEVEL: "warn" } as unknown as NodeJS.ProcessEnv)).toEqual({ url: "https://x.invalid/a", token: "t", minLevel: "warn" });
    expect(shouldForward("info", "warn")).toBe(false);
    expect(shouldForward("warn", "error")).toBe(false);
    expect(shouldForward("warn", "warn")).toBe(true);
    expect(shouldForward("error", "error")).toBe(true);
  });

  it("POST JSON com Bearer, serviço/versão e o evento; conta enviados", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe(cfg.url);
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({ service: "ferrosite", dropped: 0, events: [{ level: "error", event: "x" }] });
      return new Response(null, { status: 202 });
    });
    const sink = createWebhookSink(cfg, fetchImpl as unknown as typeof fetch);
    await sink.send(ev());
    await sink.send(ev("warn")); // abaixo do nível: ignorado
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sink.stats()).toEqual({ sent: 1, failed: 0, dropped: 0 });
  });

  it("falha HTTP ou de rede nunca lança; limite de 60/min descarta e informa no próximo envio", async () => {
    let t = 1_000_000;
    const bodies: string[] = [];
    const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) => {
      bodies.push(String(init?.body));
      return bodies.length === 1 ? new Response("x", { status: 500 }) : new Response(null, { status: 200 });
    });
    const sink = createWebhookSink(cfg, fetchImpl as unknown as typeof fetch, () => t);
    await sink.send(ev());
    expect(sink.stats().failed).toBe(1);
    for (let i = 0; i < 70; i += 1) await sink.send(ev());
    expect(sink.stats()).toEqual({ sent: 59, failed: 1, dropped: 11 });
    t += 61_000;
    await sink.send(ev());
    expect(JSON.parse(bodies.at(-1)!).dropped).toBe(11);
    const down = createWebhookSink(cfg, (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch);
    await expect(down.send(ev())).resolves.toBeUndefined();
    expect(down.stats().failed).toBe(1);
  });

  it("logEvent encaminha error/warn já redigidos ao sink configurado e info não", async () => {
    vi.stubEnv("ERROR_SINK_URL", "https://coletor.invalid/ingest");
    vi.stubEnv("ERROR_SINK_LEVEL", "warn");
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: unknown, init?: RequestInit) => {
      calls.push(String(init?.body));
      return new Response(null, { status: 200 });
    }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    resetErrorSink();
    expect(getErrorSink().configured).toBe(true);
    logEvent("error", "boom", { password: "segredo", route: "/x" });
    logEvent("warn", "meh");
    logEvent("info", "hi");
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('"password":"[redacted]"');
    expect(calls[0]).not.toContain("segredo");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sem configuração o sink é no-op", () => {
    vi.stubEnv("ERROR_SINK_URL", "");
    resetErrorSink();
    expect(getErrorSink().configured).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("relato do navegador", () => {
  it("valida campos, corta tamanhos e recusa caminho absoluto de outro site", () => {
    expect(parseClientReport(null)).toBeNull();
    expect(parseClientReport({ scope: "admin", name: "E", message: "m" })).toBeNull();
    expect(parseClientReport({ scope: "public", name: "E" })).toBeNull();
    expect(parseClientReport({ scope: "public", name: "E", message: "m", path: "https://evil.invalid" })).toBeNull();
    const r = parseClientReport({ scope: "portal", name: "TypeError", message: "x\ny".padEnd(600, "z"), digest: "d1", path: "/portal/x", extra: "ignorado" });
    expect(r).toMatchObject({ scope: "portal", name: "TypeError", digest: "d1", path: "/portal/x" });
    expect(r!.message).toHaveLength(500);
    expect(r!.message).not.toContain("\n");
    expect("extra" in r!).toBe(false);
  });

  it("corpo grande é recusado; 30 relatos por minuto por origem", () => {
    expect(isBodyTooLarge("x".repeat(4097))).toBe(true);
    expect(isBodyTooLarge("x".repeat(4096))).toBe(false);
    let t = 0;
    for (let i = 0; i < 30; i += 1) expect(allowClientReport("o1", t)).toBe(true);
    expect(allowClientReport("o1", t)).toBe(false);
    expect(allowClientReport("o2", t)).toBe(true);
    t += 60_000;
    expect(allowClientReport("o1", t)).toBe(true);
  });
});
