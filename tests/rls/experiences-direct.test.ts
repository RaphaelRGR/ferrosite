import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * EXP-001: administração/coordenação publicam experiência direto (publish_experience), sem segunda
 * pessoa. O atalho não vale para notícia, não vale para membro e não abre exceção no fluxo normal.
 */
let h: Harness;
const ids: Record<string, string> = {};
let experience = "";
let news = "";

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
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
  const photo = (await rows(ids.admin, "insert into public.file_asset (external_id, name, mime_type, size_bytes, content_hash, status, classification, consent, owner_id, created_by, updated_by) values ('drive-foto-1234567890', 'Grupo.jpg', 'image/jpeg', 100, 'h', 'verified', 'public', 'granted', $1, $1, $1) returning id", [ids.admin]))[0].id;
  experience = (await rows(ids.admin, "insert into public.content_item (type, locale, slug, title, summary, cover_file_id, consent_confirmed, photo_folder_id, author_id, updated_by) values ('experience', 'pt', 'visita-direta-2026', 'Visita técnica: Direta', 'Resumo', $1, true, '1xGWLaUHUJuvhDwcZWqmRa2R7KLim-HbK', $2, $2) returning id", [photo, ids.admin]))[0].id;
  await rows(ids.admin, "insert into public.content_file (item_id, file_id, kind, position, linked_by) values ($1, $2, 'gallery', 1, $3)", [experience, photo, ids.admin]);
  news = (await rows(ids.admin, "insert into public.content_item (type, locale, slug, title, summary, author_id, updated_by) values ('news', 'pt', 'noticia-x', 'Notícia X', 'Resumo', $1, $1) returning id", [ids.admin]))[0].id;
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("publicação direta de experiência", () => {
  it("membro não publica; notícia não usa o atalho", async () => {
    expect(await fails(ids.member, "select public.publish_experience($1)", [experience])).toMatch(/publicação é da coordenação/);
    expect(await fails(ids.admin, "select public.publish_experience($1)", [news])).toMatch(/só vale para experiências/);
  });

  it("o autor (admin) publica a própria experiência num passo, com galeria e capa", async () => {
    await rows(ids.admin, "select public.publish_experience($1)", [experience]);
    const [pub] = await rows(null, "select slug, cover_file_id, gallery_file_ids from public.public_publication where slug = 'visita-direta-2026'");
    expect(pub.cover_file_id).not.toBeNull();
    expect(pub.gallery_file_ids).toHaveLength(1);
    expect((await rows(ids.admin, "select status::text from public.content_item where id = $1", [experience]))[0].status).toBe("published");
  });

  it("republicar depois de ocultar a foto troca a galeria do site", async () => {
    await rows(ids.admin, "update public.content_file set kind = 'attachment' where item_id = $1", [experience]);
    expect((await rows(ids.admin, "select status::text from public.content_item where id = $1", [experience]))[0].status).toBe("draft");
    // o site continua com a versão anterior até atualizar
    expect((await rows(null, "select gallery_file_ids from public.public_publication where slug = 'visita-direta-2026'"))[0].gallery_file_ids).toHaveLength(1);
    await rows(ids.coord, "select public.publish_experience($1)", [experience]);
    expect((await rows(null, "select gallery_file_ids from public.public_publication where slug = 'visita-direta-2026'"))[0].gallery_file_ids).toHaveLength(0);
  });

  it("fora da função, o autor continua sem aprovar o próprio conteúdo", async () => {
    await rows(ids.admin, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [news, ids.admin]);
    expect(await fails(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [news, ids.admin])).toMatch(/autor não aprova/);
    // nem com a GUC ligada à mão: o atalho só vale para experiência
    let msg = "";
    try {
      await h.as(ids.admin, async (c) => {
        await c.query("select set_config('ferrosite.direct_publish', 'on', true)");
        await c.query("update public.content_item set status = 'approved', updated_by = $2 where id = $1", [news, ids.admin]);
      });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/autor não aprova/);
  });

  it("a pasta de fotos só aceita id do Drive", async () => {
    const bad = await h.admin.query("update public.content_item set photo_folder_id = 'x; drop' where id = $1", [experience]).then(() => null, (e: Error) => e.message);
    expect(bad).toMatch(/check constraint/);
  });
});
