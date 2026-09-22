import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * DRIVE-004: galeria de conteúdo (content_file) com RLS de autor/overseer;
 * mexer na galeria de conteúdo aprovado volta a rascunho; a publicação congela
 * só os arquivos com consentimento; o site recebe galeria e bytes apenas de
 * arquivos verificados, públicos e com consentimento de publicação viva.
 */
let h: Harness;
const ids: Record<string, string> = {};
let itemId = "";
const files: Record<string, string> = {};

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
  for (const [key, consent] of [["ok", "granted"], ["pending", "pending"], ["cover", "not_required"]] as const) {
    files[key] = (await rows(ids.coord, "insert into public.file_asset (external_id, name, mime_type, size_bytes, content_hash, status, classification, consent, owner_id, created_by, updated_by) values ($1, $2, 'image/jpeg', 100, 'h', 'verified', 'public', $3, $4, $4, $4) returning id", [`drive-${key}-1234567890`, `${key}.jpg`, consent, ids.coord]))[0].id;
  }
  itemId = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, summary, cover_file_id, consent_confirmed, author_id, updated_by) values ('experience', 'pt', 'visita-x', 'Visita X', 'Resumo', $1, true, $2, $2) returning id", [files.cover, ids.coord]))[0].id;
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("galeria de conteúdo", () => {
  it("autor vincula arquivos que vê; membro sem relação não vê nem vincula", async () => {
    await rows(ids.coord, "insert into public.content_file (item_id, file_id, kind, position, caption, linked_by) values ($1, $2, 'gallery', 2, 'Pátio', $3), ($1, $4, 'gallery', 1, '', $3)", [itemId, files.ok, ids.coord, files.pending]);
    expect(await rows(ids.coord, "select file_id from public.content_file where item_id = $1", [itemId])).toHaveLength(2);
    expect(await rows(ids.member, "select file_id from public.content_file where item_id = $1", [itemId])).toHaveLength(0);
    expect(await fails(ids.member, "insert into public.content_file (item_id, file_id, linked_by) values ($1, $2, $3)", [itemId, files.ok, ids.member])).toMatch(/row-level security/);
  });

  it("publicação congela só a galeria com consentimento; alterar a galeria depois volta o item a rascunho", async () => {
    await rows(ids.coord, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [itemId, ids.coord]);
    await rows(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [itemId, ids.admin]);
    await rows(ids.admin, "select public.publish_content($1)", [itemId]);
    const [pub] = await rows(null, "select id, gallery_file_ids, cover_file_id from public.public_publication where slug = 'visita-x'");
    expect(pub.gallery_file_ids).toEqual([files.ok]); // 'pending' fica fora
    expect(pub.cover_file_id).toBe(files.cover);
    const gallery = await rows(null, "select * from public.public_gallery($1)", [pub.id]);
    expect(gallery).toHaveLength(1);
    expect(gallery[0]).toMatchObject({ file_id: files.ok, caption: "Pátio" });
    expect(await publicInfo(files.ok)).toHaveLength(1);
    expect(await publicInfo(files.pending)).toHaveLength(0);
    expect(await publicInfo(files.cover)).toHaveLength(1);

    // consentimento chega depois: o item precisa ser republicado para o site ver
    await rows(ids.coord, "update public.file_asset set consent = 'granted', updated_by = $2 where id = $1", [files.pending, ids.coord]);
    expect(await publicInfo(files.pending)).toHaveLength(0);
    // mexer na galeria de item publicado ⇒ rascunho
    await rows(ids.coord, "update public.content_file set caption = 'Nova' where item_id = $1 and file_id = $2", [itemId, files.pending]);
    expect((await rows(ids.coord, "select status from public.content_item where id = $1", [itemId]))[0].status).toBe("draft");
    // a publicação viva continua igual até nova aprovação
    expect((await rows(null, "select gallery_file_ids from public.public_publication where slug = 'visita-x'"))[0].gallery_file_ids).toEqual([files.ok]);
  });

  it("despublicar tira a galeria do site", async () => {
    await rows(ids.admin, "select public.unpublish_content($1, 'teste')", [itemId]);
    expect(await publicInfo(files.ok)).toHaveLength(0);
    expect(await rows(null, "select id from public.public_publication where slug = 'visita-x'")).toHaveLength(0);
  });
});
