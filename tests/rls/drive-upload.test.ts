import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * DRIVE-003: allowlist com `uploadable` (ZIP/vídeo fora), cache de pastas só
 * service role, registro de upload já verificado audita `file.uploaded` com
 * quem/quando, e o caminho lógico fica no arquivo.
 */
let h: Harness;
const ids: Record<string, string> = {};

const rows = async (userId: string | null, sql: string, params: unknown[] = []) =>
  h.as(userId, async (c) => (await c.query(sql, params)).rows);
const fails = async (userId: string | null, sql: string, params: unknown[] = []) => {
  try {
    await h.as(userId, (c) => c.query(sql, params));
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("allowlist de upload", () => {
  it("imagens, PDF, CAD e Office podem subir; ZIP não existe e vídeo só se registra", async () => {
    const list = await rows(ids.member, "select mime_type, uploadable, extension from public.file_type_allowlist order by mime_type");
    const up = Object.fromEntries(list.map((r) => [r.mime_type, r.uploadable]));
    expect(up["image/jpeg"]).toBe(true);
    expect(up["application/pdf"]).toBe(true);
    expect(up["model/stl"]).toBe(true);
    expect(up["application/dxf"]).toBe(true);
    expect(up["application/sldworks"]).toBe(true);
    expect(up["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]).toBe(true);
    expect(up["video/mp4"]).toBe(false);
    expect(up["application/zip"]).toBeUndefined();
    expect(list.every((r) => r.extension !== "")).toBe(true);
    expect(await fails(ids.admin, "update public.file_type_allowlist set uploadable = true where mime_type = 'video/mp4'")).toBeNull(); // sem policy: 0 linhas
    expect((await h.admin.query("select uploadable from public.file_type_allowlist where mime_type = 'video/mp4'")).rows[0].uploadable).toBe(false);
  });
});

describe("cache de pastas e registro de upload", () => {
  it("drive_folder: ninguém autenticado lê/escreve; caminho validado", async () => {
    expect(await fails(ids.admin, "select * from public.drive_folder")).toMatch(/permission denied/);
    expect(await fails(ids.member, "insert into public.drive_folder (path, drive_id) values ('x', '1234567890abc')")).toMatch(/permission denied/);
    await h.asService((c) => c.query("insert into public.drive_folder (path, drive_id, created_by) values ('projetos/comunica-ferro/galeria', '1234567890abc', $1)", [ids.member]));
    await expect(h.asService((c) => c.query("insert into public.drive_folder (path, drive_id) values ('../etc', '1234567890abc')"))).rejects.toThrow(/check/);
    await expect(h.asService((c) => c.query("insert into public.drive_folder (path, drive_id) values ('Maiusc/x', '1234567890abc')"))).rejects.toThrow(/check/);
  });

  it("upload registrado como verificado com storage_path audita file.uploaded com quem/quando; registro manual não", async () => {
    const [f] = await rows(ids.member, "insert into public.file_asset (external_id, name, mime_type, size_bytes, content_hash, status, storage_path, drive_folder_id, owner_id, created_by, updated_by) values ('drive-upl-123456', '2026-09-21 foto.jpg', 'image/jpeg', 1234, 'md5x', 'verified', 'projetos/comunica-ferro/galeria', '1234567890abc', $1, $1, $1) returning id, verified_at, verified_by", [ids.member]);
    expect(f.verified_by).toBe(ids.member);
    expect(f.verified_at).not.toBeNull();
    const audit = (await h.admin.query("select diff from public.audit_event where action = 'file.uploaded' and target_id = $1", [f.id])).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0].diff).toMatchObject({ path: "projetos/comunica-ferro/galeria", mime: "image/jpeg", size: 1234, hash: "md5x" });

    const [m] = await rows(ids.member, "insert into public.file_asset (external_id, name, mime_type, owner_id, created_by, updated_by) values ('drive-manual-123456', 'x.jpg', 'image/jpeg', $1, $1, $1) returning id", [ids.member]);
    expect((await h.admin.query("select count(*)::int as n from public.audit_event where action = 'file.uploaded' and target_id = $1", [m.id])).rows[0].n).toBe(0);
  });
});
