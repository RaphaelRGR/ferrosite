import { describe, expect, it, vi } from "vitest";
import { dispatchMailOutbox } from "@/lib/mail/dispatch";
import { createResendProvider, readMailEnv, type MailProvider } from "@/lib/mail/provider";
import { MAIL_TEMPLATES, renderMail } from "@/lib/mail/templates";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mockAdmin }));

let claimRows: unknown[] = [];
const settled: { p_id: string; p_ok: boolean; p_detail?: string; p_retry?: boolean }[] = [];
const mockAdmin = {
  rpc: async (fn: string, args: Record<string, unknown>) => {
    if (fn === "claim_mail_outbox") return { data: claimRows, error: null };
    if (fn === "settle_mail_outbox") {
      settled.push(args as never);
      return { data: null, error: null };
    }
    throw new Error(`rpc inesperada: ${fn}`);
  },
};

const row = (over: Record<string, unknown> = {}) => ({
  id: "m1", template: "challenge_received", locale: "pt", recipient_email: "a@b.invalid", recipient_profile_id: null,
  target_type: "", target_id: "", payload: { protocol: "DES-2026-000001", title: "T", contactName: "Ana" }, status: "queued",
  attempts: 1, last_error: "", provider_message_id: "", created_at: "", claimed_at: null, sent_at: null, ...over,
});

describe("templates (MAIL-001)", () => {
  it("todos os templates renderizam em PT e EN, com assunto e texto próprios (sem fallback)", () => {
    const payloads: Record<string, unknown> = {
      challenge_received: { protocol: "DES-2026-000001", title: "Rodas", contactName: "Ana" },
      content_review_requested: { title: "Nota", type: "news", slug: "nota", contentLocale: "pt" },
      content_decided: { title: "Nota", decision: "changes_requested" },
      content_published: { title: "Nota", type: "news", slug: "nota", contentLocale: "en" },
      membership_granted: { projectTitle: "Projeto X", projectSlug: "projeto-x", role: "external", expiresAt: "2026-12-31T23:59:59Z" },
    };
    for (const template of MAIL_TEMPLATES) {
      const pt = renderMail({ template, locale: "pt", payload: payloads[template], siteUrl: "https://exemplo.invalid" });
      const en = renderMail({ template, locale: "en", payload: payloads[template], siteUrl: "https://exemplo.invalid" });
      expect(pt, template).not.toBeNull();
      expect(en, template).not.toBeNull();
      expect(pt!.subject).not.toBe(en!.subject);
      expect(pt!.text).not.toBe(en!.text);
      expect(pt!.text).toContain("não responda");
      expect(en!.text).toContain("do not reply");
    }
  });

  it("links usam a origem do site e o caminho público do conteúdo; sem origem, não inventa domínio", () => {
    const withUrl = renderMail({ template: "content_published", locale: "en", payload: { title: "N", type: "news", slug: "nota", contentLocale: "en" }, siteUrl: "https://exemplo.invalid" })!;
    expect(withUrl.text).toContain("https://exemplo.invalid/en/noticias/nota");
    const noUrl = renderMail({ template: "content_published", locale: "en", payload: { title: "N", type: "news", slug: "nota", contentLocale: "en" }, siteUrl: "" })!;
    expect(noUrl.text).not.toMatch(/https?:\/\//);
    const noPublicPath = renderMail({ template: "content_published", locale: "pt", payload: { title: "N", type: "partner_case", slug: "x", contentLocale: "pt" }, siteUrl: "https://exemplo.invalid" })!;
    expect(noPublicPath.text).not.toMatch(/https?:\/\//);
  });

  it("escapa HTML e corta quebras de linha vindas do payload; template desconhecido ou sem protocolo devolve null", () => {
    const m = renderMail({ template: "challenge_received", locale: "pt", payload: { protocol: "DES-2026-000002", title: "<script>alert(1)</script>\nlinha", contactName: "A" }, siteUrl: "" })!;
    expect(m.html).toContain("&lt;script&gt;");
    expect(m.html).not.toContain("<script>");
    expect(m.subject).not.toContain("\n");
    expect(renderMail({ template: "nope", locale: "pt", payload: {}, siteUrl: "" })).toBeNull();
    expect(renderMail({ template: "challenge_received", locale: "pt", payload: {}, siteUrl: "" })).toBeNull();
  });

  it("papel e decisão são traduzidos por idioma", () => {
    expect(renderMail({ template: "membership_granted", locale: "pt", payload: { projectTitle: "P", projectSlug: "p", role: "leader" }, siteUrl: "" })!.text).toContain("como líder");
    expect(renderMail({ template: "membership_granted", locale: "en", payload: { projectTitle: "P", projectSlug: "p", role: "leader" }, siteUrl: "" })!.text).toContain("as leader");
    expect(renderMail({ template: "content_decided", locale: "pt", payload: { title: "N", decision: "approved" }, siteUrl: "" })!.subject).toContain("aprovado");
  });
});

describe("provedor Resend via fetch", () => {
  const cfg = { apiKey: "re_test", from: "Curso <no-reply@exemplo.invalid>", replyTo: "coord@exemplo.invalid" };
  const mail = { subject: "S", text: "T", html: "<p>T</p>" };

  it("env incompleta ⇒ não configurado", () => {
    expect(readMailEnv({} as NodeJS.ProcessEnv)).toBeNull();
    expect(readMailEnv({ RESEND_API_KEY: "x" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(readMailEnv({ RESEND_API_KEY: "x", MAIL_FROM: "a@b.invalid" } as unknown as NodeJS.ProcessEnv)).toEqual({ apiKey: "x", from: "a@b.invalid", replyTo: "" });
  });

  it("monta a chamada com Bearer, remetente, reply_to e devolve o id", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
      expect(body).toMatchObject({ from: cfg.from, to: ["x@y.invalid"], subject: "S", reply_to: cfg.replyTo });
      return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
    });
    const out = await createResendProvider(cfg, fetchImpl as unknown as typeof fetch).send({ to: "x@y.invalid", mail });
    expect(out).toEqual({ ok: true, id: "msg_1" });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.resend.com/emails");
  });

  it("4xx é definitivo; 429/5xx e falha de rede são transitórios", async () => {
    const p = (status: number) => createResendProvider(cfg, (async () => new Response("erro", { status })) as unknown as typeof fetch);
    expect(await p(422).send({ to: "x@y.invalid", mail })).toMatchObject({ ok: false, retryable: false });
    expect(await p(429).send({ to: "x@y.invalid", mail })).toMatchObject({ ok: false, retryable: true });
    expect(await p(503).send({ to: "x@y.invalid", mail })).toMatchObject({ ok: false, retryable: true });
    const down = createResendProvider(cfg, (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch);
    expect(await down.send({ to: "x@y.invalid", mail })).toMatchObject({ ok: false, retryable: true, error: "network: TypeError" });
  });
});

describe("dispatch", () => {
  it("sem provedor não toca o banco", async () => {
    settled.length = 0;
    expect(await dispatchMailOutbox(10, null)).toEqual({ configured: false, claimed: 0, sent: 0, failed: 0, requeued: 0 });
    expect(settled).toHaveLength(0);
  });

  it("envia, re-enfileira transitório, falha definitivo e template inválido", async () => {
    settled.length = 0;
    claimRows = [row({ id: "ok" }), row({ id: "retry", locale: "en" }), row({ id: "dead" }), row({ id: "bad", template: "nope" })];
    const sent: string[] = [];
    const provider: MailProvider = {
      name: "fake",
      async send({ to, mail }) {
        sent.push(mail.subject);
        if (mail.subject.startsWith("Challenge")) return { ok: false, error: "http 503", retryable: true };
        if (sent.length === 3) return { ok: false, error: "http 422", retryable: false };
        return { ok: true, id: `id-${to}` };
      },
    };
    const r = await dispatchMailOutbox(10, provider);
    expect(r).toEqual({ configured: true, claimed: 4, sent: 1, failed: 2, requeued: 1 });
    expect(settled).toEqual([
      { p_id: "ok", p_ok: true, p_detail: "id-a@b.invalid" },
      { p_id: "retry", p_ok: false, p_detail: "http 503", p_retry: true },
      { p_id: "dead", p_ok: false, p_detail: "http 422", p_retry: false },
      { p_id: "bad", p_ok: false, p_detail: "template desconhecido ou payload incompleto", p_retry: false },
    ]);
    expect(sent).toHaveLength(3); // template inválido não chega ao provedor
  });
});
