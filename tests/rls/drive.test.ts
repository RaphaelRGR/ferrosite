import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * DRIVE-001: verificação auditada e revertida ao trocar o arquivo; a publicação
 * carrega a capa (id opaco) até a projeção pública; o site só recebe dados de
 * um arquivo verificado, público, com consentimento, de tipo de galeria e capa
 * de publicação viva — e só via função restrita ao service role.
 */
let h: Harness;
const ids: Record<string, string> = {};
let fileId = "";
let itemId = "";

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
const publicInfo = async (id: string) => h.asService(async (c) => (await c.query("select * from public.public_file_info($1)", [id])).rows);

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("verificação", () => {
  it("verificar registra quem/quando/hash em auditoria; trocar o id no provedor volta a 'registered'", async () => {
    fileId = (await rows(ids.member, "insert into public.file_asset (external_id, name, mime_type, size_bytes, classification, consent, owner_id, created_by, updated_by) values ('drive-abc-1234567890', 'foto.jpg', 'image/jpeg', 1000, 'public', 'granted', $1, $1, $1) returning id", [ids.member]))[0].id;
    await rows(ids.member, "update public.file_asset set status = 'verified', content_hash = 'md5-1', size_bytes = 1234, updated_by = $2 where id = $1", [fileId, ids.member]);
    const [f] = await rows(ids.member, "select status, verified_by, verified_at from public.file_asset where id = $1", [fileId]);
    expect(f.status).toBe("verified");
    expect(f.verified_by).toBe(ids.member);
    expect(f.verified_at).not.toBeNull();
    const audit = (await h.admin.query("select diff from public.audit_event where action = 'file.verified' and target_id = $1", [fileId])).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0].diff.hash).toBe("md5-1");

    await rows(ids.member, "update public.file_asset set external_id = 'drive-xyz-0987654321', updated_by = $2 where id = $1", [fileId, ids.member]);
    const [g] = await rows(ids.member, "select status, verified_by, verified_at from public.file_asset where id = $1", [fileId]);
    expect(g.status).toBe("registered");
    expect(g.verified_by).toBeNull();
    expect(g.verified_at).toBeNull();
  });
});

describe("capa pública", () => {
  it("publicação carrega cover_file_id e a projeção pública o expõe; o site nada recebe até o arquivo ser verificado", async () => {
    await rows(ids.member, "update public.file_asset set consent = 'granted', updated_by = $2 where id = $1", [fileId, ids.member]);
    itemId = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, cover_file_id, consent_confirmed, author_id, updated_by) values ('news', 'pt', 'com-capa', 'Com capa', $1, true, $2, $2) returning id", [fileId, ids.coord]))[0].id;
    await rows(ids.coord, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [itemId, ids.coord]);
    await rows(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [itemId, ids.admin]);
    await rows(ids.admin, "select public.publish_content($1)", [itemId]);
    const [pub] = await rows(null, "select cover_file_id from public.public_publication where slug = 'com-capa'");
    expect(pub.cover_file_id).toBe(fileId);
    expect(await publicInfo(fileId)).toHaveLength(0); // ainda 'registered'
  });

  it("verificado + público + consentimento + imagem + publicação viva ⇒ site recebe id externo e MIME; qualquer condição a menos ⇒ nada", async () => {
    await rows(ids.member, "update public.file_asset set status = 'verified', content_hash = 'md5-2', updated_by = $2 where id = $1", [fileId, ids.member]);
    const info = await publicInfo(fileId);
    expect(info).toHaveLength(1);
    expect(info[0]).toMatchObject({ external_id: "drive-xyz-0987654321", mime_type: "image/jpeg", content_hash: "md5-2" });

    await h.admin.query("update public.file_asset set classification = 'internal' where id = $1", [fileId]);
    expect(await publicInfo(fileId)).toHaveLength(0);
    await h.admin.query("update public.file_asset set classification = 'public', consent = 'pending' where id = $1", [fileId]);
    expect(await publicInfo(fileId)).toHaveLength(0);
    await h.admin.query("update public.file_asset set consent = 'granted', mime_type = 'application/pdf' where id = $1", [fileId]);
    expect(await publicInfo(fileId)).toHaveLength(0);
    await h.admin.query("update public.file_asset set mime_type = 'image/jpeg' where id = $1", [fileId]);
    expect(await publicInfo(fileId)).toHaveLength(1);

    await rows(ids.admin, "select public.unpublish_content($1, 'teste')", [itemId]);
    expect(await publicInfo(fileId)).toHaveLength(0);
    await rows(ids.admin, "select public.publish_content($1)", [itemId]);
    expect(await publicInfo(fileId)).toHaveLength(1);
  });

  it("função pública é só do service role; anon não lê file_asset", async () => {
    expect(await fails(null, "select * from public.public_file_info($1)", [fileId])).toMatch(/permission denied/);
    expect(await fails(ids.member, "select * from public.public_file_info($1)", [fileId])).toMatch(/permission denied/);
    expect(await fails(null, "select id from public.file_asset")).toMatch(/permission denied/);
  });
});
