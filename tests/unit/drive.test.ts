import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { buildAssertion, createDriveClient, parseDriveId, readDriveEnv, type DriveFileMeta } from "@/lib/files/drive";
import { proxyDriveFile, proxyDriveThumbnail } from "@/lib/files/proxy";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const cfg = { clientEmail: "svc@proj.iam.gserviceaccount.com", privateKey: pem, rootFolderId: "" };

describe("configuração (DRIVE-001)", () => {
  it("aceita PEM com \\n escapado ou base64; rejeita chave que não é PEM", () => {
    expect(readDriveEnv({} as NodeJS.ProcessEnv)).toBeNull();
    const escaped = readDriveEnv({ GOOGLE_SERVICE_ACCOUNT_EMAIL: "a@b", GOOGLE_SERVICE_ACCOUNT_KEY: pem.replace(/\n/g, "\\n") } as unknown as NodeJS.ProcessEnv);
    expect(escaped?.privateKey).toBe(pem);
    const b64 = readDriveEnv({ GOOGLE_SERVICE_ACCOUNT_EMAIL: "a@b", GOOGLE_SERVICE_ACCOUNT_KEY: Buffer.from(pem).toString("base64"), GOOGLE_DRIVE_ROOT_FOLDER_ID: "root1" } as unknown as NodeJS.ProcessEnv);
    expect(b64).toEqual({ clientEmail: "a@b", privateKey: pem, rootFolderId: "root1" });
    expect(readDriveEnv({ GOOGLE_SERVICE_ACCOUNT_EMAIL: "a@b", GOOGLE_SERVICE_ACCOUNT_KEY: "nao-e-chave" } as unknown as NodeJS.ProcessEnv)).toBeNull();
  });

  it("extrai o fileId de links de compartilhamento e rejeita domínios estranhos", () => {
    expect(parseDriveId("1AbCdEfGhIjKlMnOpQrStUvWxYz")).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
    expect(parseDriveId("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing")).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
    expect(parseDriveId("https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz")).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
    expect(parseDriveId("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit")).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
    expect(parseDriveId("https://evil.invalid/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view")).toBeNull();
    expect(parseDriveId("curto")).toBeNull();
    expect(parseDriveId("")).toBeNull();
  });

  it("assinatura RS256 verificável com a chave pública; claims com escopo somente leitura e 1 h", () => {
    const jwt = buildAssertion(cfg, 1_700_000_000);
    const [h, c, s] = jwt.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claims).toMatchObject({ iss: cfg.clientEmail, scope: "https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: 1_700_000_000, exp: 1_700_003_600 });
    const v = createVerify("RSA-SHA256");
    v.update(`${h}.${c}`);
    expect(v.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
  });
});

function fakeFetch(handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>) {
  const calls: string[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push(u);
    for (const [prefix, h] of Object.entries(handlers)) if (u.startsWith(prefix)) return h(init);
    return new Response("nope", { status: 404 });
  });
  return { fn: fn as unknown as typeof fetch, calls };
}
const tokenOk = () => new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
const FILES = "https://www.googleapis.com/drive/v3/files/";

describe("cliente Drive", () => {
  it("troca o JWT por token uma vez (cache) e lê metadados com Bearer", async () => {
    const { fn, calls } = fakeFetch({
      "https://oauth2.googleapis.com/token": tokenOk,
      [`${FILES}f1`]: (init) => {
        expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
        return new Response(JSON.stringify({ id: "f1", name: "a.jpg", mimeType: "image/jpeg", size: "123", md5Checksum: "m", parents: ["p1"], hasThumbnail: true }), { status: 200 });
      },
    });
    const drive = createDriveClient(cfg, fn, { current: null });
    const a = await drive.getMeta("f1");
    const b = await drive.getMeta("f1");
    expect(a).toEqual({ ok: true, meta: { id: "f1", name: "a.jpg", mimeType: "image/jpeg", size: 123, md5: "m", trashed: false, parents: ["p1"], hasThumbnail: true } });
    expect(b.ok).toBe(true);
    expect(calls.filter((u) => u.startsWith("https://oauth2"))).toHaveLength(1);
  });

  it("404/403/lixeira/erro de rede viram códigos próprios", async () => {
    const mk = (status: number, body = "{}") => createDriveClient(cfg, fakeFetch({ "https://oauth2.googleapis.com/token": tokenOk, [FILES]: () => new Response(body, { status }) }).fn, { current: null });
    expect(await mk(404).getMeta("x")).toEqual({ ok: false, error: "not_found" });
    expect(await mk(403).getMeta("x")).toEqual({ ok: false, error: "forbidden" });
    expect(await mk(200, JSON.stringify({ id: "x", name: "n", mimeType: "image/png", trashed: true })).getMeta("x")).toEqual({ ok: false, error: "trashed" });
    expect((await mk(500).getMeta("x")) as { error: string }).toMatchObject({ ok: false, error: "provider" });
    const down = createDriveClient(cfg, (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch, { current: null });
    expect(await down.getMeta("x")).toMatchObject({ ok: false, error: "provider" });
  });

  it("pasta raiz: aceita descendente (subindo pelos pais), rejeita fora dela; sem raiz aceita tudo", async () => {
    const tree: Record<string, string[]> = { sub: ["root1"], deep: ["sub"], other: ["elsewhere"] };
    const { fn } = fakeFetch({
      "https://oauth2.googleapis.com/token": tokenOk,
      [FILES]: (init) => {
        void init;
        return new Response("{}", { status: 404 });
      },
    });
    const withTree = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      const id = u.match(/files\/([^?]+)/)?.[1];
      if (id && id in tree) return new Response(JSON.stringify({ parents: tree[id] }), { status: 200 });
      return fn(url, init);
    }) as unknown as typeof fetch;
    const meta = (parents: string[]): DriveFileMeta => ({ id: "f", name: "n", mimeType: "image/png", size: 1, md5: null, trashed: false, parents, hasThumbnail: false });
    const rooted = createDriveClient({ ...cfg, rootFolderId: "root1" }, withTree, { current: null });
    expect(await rooted.withinRoot(meta(["root1"]))).toBe(true);
    expect(await rooted.withinRoot(meta(["deep"]))).toBe(true);
    expect(await rooted.withinRoot(meta(["other"]))).toBe(false);
    expect(await rooted.withinRoot(meta([]))).toBe(false);
    const open = createDriveClient(cfg, withTree, { current: null });
    expect(await open.withinRoot(meta(["other"]))).toBe(true);
  });
});

describe("proxy", () => {
  const drive = (status: number, body = "bytes", headers: Record<string, string> = {}) =>
    ({
      getMeta: vi.fn(),
      withinRoot: vi.fn(),
      download: vi.fn(async () => new Response(body, { status, headers: { "Content-Type": "text/html", ...headers } })),
      thumbnail: vi.fn(async () => new Response(body, { status, headers: { "Content-Type": headers["Content-Type"] ?? "image/jpeg" } })),
    });
  const file = { external_id: "f1", mime_type: "image/jpeg", name: 'foto "1"/x.jpg', size_bytes: 10 };

  it("repassa bytes com o MIME do banco (não o do provedor), nosniff, disposição segura e Range", async () => {
    const d = drive(206, "part", { "Content-Range": "bytes 0-3/10", "Content-Length": "4" });
    const res = await proxyDriveFile(d, file, { range: "bytes=0-3", disposition: "attachment", cache: "private, no-store" });
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="foto _1_x.jpg"');
    expect(res.headers.get("Content-Range")).toBe("bytes 0-3/10");
    expect(await res.text()).toBe("part");
    expect((d.download as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(["f1", "bytes=0-3"]);
  });

  it("404/403 do provedor ⇒ 404; 5xx ⇒ 502; acima do limite ⇒ 413", async () => {
    expect((await proxyDriveFile(drive(403), file, { disposition: "inline", cache: "" })).status).toBe(404);
    expect((await proxyDriveFile(drive(500), file, { disposition: "inline", cache: "" })).status).toBe(502);
    expect((await proxyDriveFile(drive(200), { ...file, size_bytes: 600 * 1024 * 1024 }, { disposition: "inline", cache: "" })).status).toBe(413);
  });

  it("miniatura só se o provedor devolver imagem", async () => {
    expect((await proxyDriveThumbnail(drive(200), "f1", 320, "private")).status).toBe(200);
    expect((await proxyDriveThumbnail(drive(200, "x", { "Content-Type": "text/html" }), "f1", 320, "private")).status).toBe(404);
    expect((await proxyDriveThumbnail(drive(404), "f1", 320, "private")).status).toBe(404);
  });
});
