import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

/**
 * Guard do Portal no proxy (21): sem configuração ⇒ 503 fail-closed;
 * sem sessão ⇒ 307 para /login com `next` allowlisted. Roteamento de locale
 * continua intacto. Sem rede: com env "fake" o cliente não tem cookies de
 * sessão e devolve usuário nulo sem chamar o servidor.
 */
const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const req = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${path}`, { headers });

describe("proxy: Portal fail-closed", () => {
  it("responde 503 em /portal quando o Supabase não está configurado", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await proxy(req("/portal/projetos"));
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("redireciona anônimo para /login com next allowlisted quando configurado", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-tests";
    const res = await proxy(req("/portal/acervo"));
    expect(res.status).toBe(307);
    const url = new URL(res.headers.get("location")!);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/portal/acervo");
  });

  it("não interfere no site público nem em /login sem sessão", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-tests";
    expect((await proxy(req("/pt/curso"))).status).toBe(200);
    expect((await proxy(req("/login"))).status).toBe(200);
  });
});

describe("proxy: locale", () => {
  it("redireciona / e caminhos antigos para o locale negociado", async () => {
    const home = await proxy(req("/", { "accept-language": "en-US,en;q=0.9" }));
    expect(new URL(home.headers.get("location")!).pathname).toBe("/en");
    const curso = await proxy(req("/curso", { cookie: "locale=pt", "accept-language": "en" }));
    expect(new URL(curso.headers.get("location")!).pathname).toBe("/pt/curso");
  });
});
