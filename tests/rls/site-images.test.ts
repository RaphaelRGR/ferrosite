import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/** DRIVE-004b: imagens do site — só coordenação define; o site só recebe arquivo verificado/público/com consentimento; auditado. */
let h: Harness;
const ids: Record<string, string> = {};
let fileId = "";

const rows = async (userId: string | null, sql: string, params: unknown[] = []) => h.as(userId, async (c) => (await c.query(sql, params)).rows);
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
  for (const [key, role] of [["coord", "coordination"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
  fileId = (await rows(ids.coord, "insert into public.file_asset (external_id, name, mime_type, size_bytes, content_hash, status, classification, consent, alt_text, credit, owner_id, created_by, updated_by) values ('drive-hero-1234567890', 'hero.jpg', 'image/jpeg', 100, 'h', 'registered', 'public', 'granted', 'Turma em visita', 'Acervo', $1, $1, $1) returning id", [ids.coord]))[0].id;
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("site_image", () => {
  it("membro não define; coordenação define (auditado); chave validada", async () => {
    expect(await fails(ids.member, "insert into public.site_image (key, file_id, updated_by) values ('home_hero', $1, $2)", [fileId, ids.member])).toMatch(/row-level security/);
    await rows(ids.coord, "insert into public.site_image (key, file_id, updated_by) values ('home_hero', $1, $2)", [fileId, ids.coord]);
    expect(await fails(ids.coord, "insert into public.site_image (key, file_id, updated_by) values ('Home Hero', $1, $2)", [fileId, ids.coord])).toMatch(/check/);
    expect((await h.admin.query("select count(*)::int as n from public.audit_event where action = 'site_image.insert' and target_id = 'home_hero'")).rows[0].n).toBe(1);
  });

  it("o site só recebe a imagem quando o arquivo está verificado; proxy público aceita arquivo referenciado", async () => {
    expect(await rows(null, "select * from public.public_site_image('home_hero')")).toHaveLength(0);
    expect(await h.asService(async (c) => (await c.query("select * from public.public_file_info($1)", [fileId])).rows)).toHaveLength(0);
    await rows(ids.coord, "update public.file_asset set status = 'verified', updated_by = $2 where id = $1", [fileId, ids.coord]);
    const [img] = await rows(null, "select * from public.public_site_image('home_hero')");
    expect(img).toMatchObject({ file_id: fileId, alt_text: "Turma em visita", credit: "Acervo" });
    expect(await h.asService(async (c) => (await c.query("select * from public.public_file_info($1)", [fileId])).rows)).toHaveLength(1);
    await h.admin.query("update public.file_asset set consent = 'refused' where id = $1", [fileId]);
    expect(await rows(null, "select * from public.public_site_image('home_hero')")).toHaveLength(0);
    expect(await rows(null, "select * from public.public_site_image('outra')")).toHaveLength(0);
  });
});
