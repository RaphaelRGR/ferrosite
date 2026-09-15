import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * FILE-001 (17/21): allowlist de tipo/tamanho, nome normalizado, vínculos
 * explícitos, visibilidade por vínculo, revogação/consentimento auditados.
 * PUB-001 (18): rascunho invisível ao site, revisões imutáveis, aprovação por
 * terceiro, publicação como snapshot na projeção, edição pós-aprovação volta a
 * rascunho, rollback, despublicação, locales independentes, preview por token.
 */
let h: Harness;
const ids: Record<string, string> = {};
let projectId = "";
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

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["leader", "member"], ["member", "member"], ["outsider", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
  projectId = (await rows(ids.coord, "insert into public.project (slug, name, created_by, updated_by) values ('proj', 'Projeto', $1, $1) returning id", [ids.coord]))[0].id;
  await rows(ids.coord, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'leader'), ($1, $3, 'member')", [projectId, ids.leader, ids.member]);
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("arquivos (17/21)", () => {
  it("registro exige tipo da allowlist e respeita o limite; nome é normalizado", async () => {
    const ins = (mime: string, size: number, name = "foto.jpg") =>
      fails(ids.member, "insert into public.file_asset (provider, external_id, name, mime_type, size_bytes, owner_id, created_by, updated_by) values ('google_drive', $1, $2, $3, $4, $5, $5, $5)", [`drive-${mime}-${size}`, name, mime, size, ids.member]);
    expect(await ins("application/x-msdownload", 10)).toMatch(/tipo de arquivo não permitido/);
    expect(await ins("image/jpeg", 30 * 1024 * 1024)).toMatch(/excede o limite/);
    expect(await ins("image/jpeg", 1024, "../..\\foto.jpg")).toBeNull();
    const f = await h.admin.query("select id, name from public.file_asset where mime_type = 'image/jpeg'");
    fileId = f.rows[0].id;
    expect(f.rows[0].name).toBe("....foto.jpg");
  });

  it("visibilidade: dono e overseer veem; colega só depois do vínculo ao projeto; forasteiro nunca", async () => {
    expect(await rows(ids.member, "select id from public.file_asset")).toHaveLength(1);
    expect(await rows(ids.coord, "select id from public.file_asset")).toHaveLength(1);
    expect(await rows(ids.leader, "select id from public.file_asset")).toHaveLength(0);
    await rows(ids.member, "insert into public.project_file (project_id, file_id, kind, linked_by) values ($1, $2, 'gallery', $3)", [projectId, fileId, ids.member]);
    expect(await rows(ids.leader, "select id from public.file_asset")).toHaveLength(1);
    expect(await rows(ids.outsider, "select id from public.file_asset")).toHaveLength(0);
    expect(await fails(ids.outsider, "insert into public.project_file (project_id, file_id, linked_by) values ($1, $2, $3)", [projectId, fileId, ids.outsider])).toMatch(/row-level security/);
  });

  it("só uma capa por projeto; revogação e consentimento ficam auditados; sem exclusão física", async () => {
    await rows(ids.leader, "update public.project_file set kind = 'cover' where project_id = $1 and file_id = $2", [projectId, fileId]);
    const other = (await rows(ids.leader, "insert into public.file_asset (provider, external_id, name, mime_type, owner_id, created_by, updated_by) values ('google_drive', 'drive-2', 'capa2.png', 'image/png', $1, $1, $1) returning id", [ids.leader]))[0].id;
    expect(await fails(ids.leader, "insert into public.project_file (project_id, file_id, kind, linked_by) values ($1, $2, 'cover', $3)", [projectId, other, ids.leader])).toMatch(/project_file_single_cover/);
    await rows(ids.member, "update public.file_asset set consent = 'granted', consent_note = 'Termo assinado', updated_by = $2 where id = $1", [fileId, ids.member]);
    await rows(ids.coord, "update public.file_asset set status = 'revoked', updated_by = $2 where id = $1", [other, ids.coord]);
    const audit = await h.admin.query("select action from public.audit_event where target_type = 'file_asset' order by id");
    expect(audit.rows.map((r) => r.action)).toEqual(["file.consent", "file.revoked"]);
    await expect(h.admin.query("delete from public.file_asset where id = $1", [fileId])).rejects.toThrow(/exclusão não permitida/);
  });
});

describe("publicação (18)", () => {
  it("rascunho: revisão 1 criada; anon e site (projeção) não veem nada", async () => {
    itemId = (await rows(ids.member, "insert into public.content_item (type, locale, slug, title, summary, body_md, project_id, author_id, updated_by) values ('news', 'pt', 'nova-noticia', 'Título v1', 'Resumo', 'Corpo **v1**', $1, $2, $2) returning id", [projectId, ids.member]))[0].id;
    expect(await rows(ids.coord, "select revision_no from public.content_revision where item_id = $1", [itemId])).toEqual([{ revision_no: 1 }]);
    expect(await fails(null, "select id from public.content_item")).toMatch(/permission denied/);
    expect(await rows(null, "select id from public.public_publication")).toHaveLength(0);
    expect(await rows(ids.outsider, "select id from public.content_item")).toHaveLength(0);
    expect(await rows(ids.leader, "select id from public.content_item")).toHaveLength(1); // membro do projeto vê
  });

  it("publicar sem aprovação falha; autor não aprova; coordenação aprova e publica snapshot", async () => {
    expect(await fails(ids.coord, "select public.publish_content($1)", [itemId])).toMatch(/só conteúdo aprovado/);
    await rows(ids.member, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [itemId, ids.member]);
    expect(await fails(ids.member, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [itemId, ids.member])).toMatch(/aprovação e publicação são da coordenação/);
    const authored = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, author_id, updated_by, status) values ('news', 'pt', 'da-coord', 'Da coordenação', $1, $1, 'review') returning id", [ids.coord]))[0].id;
    expect(await fails(ids.coord, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [authored, ids.coord])).toMatch(/autor não aprova/);
    expect(await fails(ids.coord, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [itemId, ids.coord])).toBeNull();
    expect(await fails(ids.member, "select public.publish_content($1)", [itemId])).toMatch(/publicação é da coordenação/);
    await rows(ids.coord, "select public.publish_content($1)", [itemId]);
    const live = await rows(null, "select slug, title, body_md, locale from public.public_publication");
    expect(live).toEqual([{ slug: "nova-noticia", title: "Título v1", body_md: "Corpo **v1**", locale: "pt" }]);
    expect((await h.admin.query("select status from public.content_item where id = $1", [itemId])).rows[0].status).toBe("published");
  });

  it("editar conteúdo publicado não altera o site: volta a rascunho, nova revisão; nova aprovação + publicação substitui", async () => {
    await rows(ids.coord, "update public.content_item set title = 'Título v2', updated_by = $2 where id = $1", [itemId, ids.coord]);
    expect((await h.admin.query("select status from public.content_item where id = $1", [itemId])).rows[0].status).toBe("draft");
    expect(await rows(null, "select title from public.public_publication")).toEqual([{ title: "Título v1" }]);
    expect(await rows(ids.coord, "select revision_no from public.content_revision where item_id = $1 order by revision_no", [itemId])).toEqual([{ revision_no: 1 }, { revision_no: 2 }]);
    await rows(ids.coord, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [itemId, ids.coord]);
    await rows(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [itemId, ids.admin]);
    await rows(ids.admin, "select public.publish_content($1)", [itemId]);
    expect(await rows(null, "select title from public.public_publication")).toEqual([{ title: "Título v2" }]);
    expect((await h.admin.query("select count(*)::int as n from public.publication where item_id = $1 and unpublished_at is not null", [itemId])).rows[0].n).toBe(1);
  });

  it("rollback restaura a revisão anterior já publicada; revisão nunca publicada não serve", async () => {
    const revs = await rows(ids.coord, "select id, revision_no from public.content_revision where item_id = $1 order by revision_no", [itemId]);
    await rows(ids.coord, "select public.publish_content($1, $2)", [itemId, revs[0].id]);
    expect(await rows(null, "select title from public.public_publication")).toEqual([{ title: "Título v1" }]);
    const draftRev = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, author_id, updated_by) values ('news', 'pt', 'outra', 'Outra', $1, $1) returning id", [ids.coord]))[0].id;
    const r = await rows(ids.coord, "select id from public.content_revision where item_id = $1", [draftRev]);
    expect(await fails(ids.coord, "select public.publish_content($1, $2)", [draftRev, r[0].id])).toMatch(/rollback só para revisão já publicada/);
  });

  it("despublicar some do site, preserva histórico e auditoria; locales são independentes", async () => {
    await rows(ids.coord, "select public.unpublish_content($1, 'correção urgente')", [itemId]);
    expect(await rows(null, "select id from public.public_publication")).toHaveLength(0);
    expect((await h.admin.query("select count(*)::int as n from public.publication where item_id = $1", [itemId])).rows[0].n).toBe(3);
    const audit = await h.admin.query("select action from public.audit_event where action like 'publication.%' order by id");
    expect(audit.rows.map((r) => r.action)).toEqual(["publication.published", "publication.published", "publication.published", "publication.unpublished"]);
    const en = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, author_id, updated_by, status) values ('news', 'en', 'nova-noticia', 'Title EN', $1, $1, 'review') returning id", [ids.coord]))[0].id;
    await rows(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [en, ids.admin]);
    await rows(ids.admin, "select public.publish_content($1)", [en]);
    expect(await rows(null, "select locale, title from public.public_publication")).toEqual([{ locale: "en", title: "Title EN" }]);
  });

  it("capa exige consentimento; preview por token só via service role e nunca para arquivado", async () => {
    const other = (await h.admin.query("select id from public.file_asset where name = 'capa2.png'")).rows[0].id;
    const withCover = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, cover_file_id, author_id, updated_by) values ('news', 'pt', 'com-capa', 'Com capa', $1, $2, $2) returning id, preview_token", [other, ids.coord]))[0];
    expect(await fails(ids.coord, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [withCover.id, ids.coord])).toMatch(/capa exige consentimento confirmado/);
    await rows(ids.coord, "update public.content_item set consent_confirmed = true, status = 'review', updated_by = $2 where id = $1", [withCover.id, ids.coord]);
    await rows(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [withCover.id, ids.admin]);
    expect(await fails(ids.admin, "select public.publish_content($1)", [withCover.id])).toMatch(/capa sem consentimento/);
    expect(withCover.preview_token).toMatch(/^[0-9a-f]{64}$/);
    expect(await fails(null, "select * from public.preview_content($1)", [withCover.preview_token])).toMatch(/permission denied/);
    expect(await fails(ids.member, "select * from public.preview_content($1)", [withCover.preview_token])).toMatch(/permission denied/);
    const preview = await h.asService(async (c) => (await c.query("select title, status from public.preview_content($1)", [withCover.preview_token])).rows);
    expect(preview).toEqual([{ title: "Com capa", status: "approved" }]);
    expect(await h.asService(async (c) => (await c.query("select title from public.preview_content('curto')")).rows)).toEqual([]);
  });
});
