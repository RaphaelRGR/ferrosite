import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/** PROJ-001: o site só vê projetos públicos fora de rascunho/cancelado/arquivado; capa/galeria só com arquivo liberado. */
let h: Harness;
const ids: Record<string, string> = {};
let projectId = "";
let fileId = "";

const rows = async (userId: string | null, sql: string, params: unknown[] = []) => h.as(userId, async (c) => (await c.query(sql, params)).rows);

beforeAll(async () => {
  h = await startHarness();
  ids.coord = await h.createUser("coord@test.invalid", "coord");
  await h.admin.query("update public.profile set global_role = 'coordination', status = 'active' where id = $1", [ids.coord]);
  projectId = (await rows(ids.coord, "insert into public.project (name, slug, summary, description_md, classification, status, created_by, updated_by) values ('Cavalos de Ferro', 'cavalos-de-ferro', 'Competição', '## Ideia\n\nTexto', 'internal', 'active', $1, $1) returning id", [ids.coord]))[0].id;
  fileId = (await rows(ids.coord, "insert into public.file_asset (external_id, name, mime_type, size_bytes, content_hash, status, classification, consent, alt_text, owner_id, created_by, updated_by) values ('drive-capa-1234567890', 'capa.jpg', 'image/jpeg', 100, 'h', 'verified', 'public', 'granted', 'Equipe', $1, $1, $1) returning id", [ids.coord]))[0].id;
  await rows(ids.coord, "insert into public.project_file (project_id, file_id, kind, linked_by) values ($1, $2, 'cover', $3)", [projectId, fileId, ids.coord]);
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("public_project", () => {
  it("interno não aparece; público aparece com capa; rascunho/arquivado somem; anon não lê a tabela", async () => {
    expect(await rows(null, "select slug from public.public_project")).toHaveLength(0);
    expect(await h.asService(async (c) => (await c.query("select * from public.public_file_info($1)", [fileId])).rows)).toHaveLength(0);
    await rows(ids.coord, "update public.project set classification = 'public', updated_by = $2 where id = $1", [projectId, ids.coord]);
    const [p] = await rows(null, "select slug, name, description_md, cover_file_id, category from public.public_project");
    expect(p).toMatchObject({ slug: "cavalos-de-ferro", cover_file_id: fileId });
    expect(await h.asService(async (c) => (await c.query("select * from public.public_file_info($1)", [fileId])).rows)).toHaveLength(1);
    const gallery = await rows(null, "select * from public.public_project_gallery('cavalos-de-ferro')");
    expect(gallery).toHaveLength(1);
    expect(gallery[0]).toMatchObject({ file_id: fileId, kind: "cover", alt_text: "Equipe" });
    await h.admin.query("update public.project set status = 'completed' where id = $1", [projectId]);
    expect(await rows(null, "select slug from public.public_project")).toHaveLength(1); // concluído continua no site
    await h.admin.query("update public.project set status = 'archived', archived_at = now() where id = $1", [projectId]);
    expect(await rows(null, "select slug from public.public_project")).toHaveLength(0);
    expect(await rows(null, "select * from public.public_project_gallery('cavalos-de-ferro')")).toHaveLength(0);
    await expect(h.as(null, (c) => c.query("select id from public.project"))).rejects.toThrow(/permission denied/);
  });
});
