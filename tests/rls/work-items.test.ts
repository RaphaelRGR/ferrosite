import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * ACT-001: ações privadas da administração e da coordenação. Admin/coordenação
 * veem tudo; dono ou aprovador fora desse grupo vê só o próprio item; membro
 * comum não vê nada. Aprovação só pelo aprovador; pedido de alteração exige
 * nota; histórico gerado pelo banco; arquivo vinculado segue a visibilidade da ação.
 */
let h: Harness;
const ids: Record<string, string> = {};

const rows = async (userId: string | null, sql: string, params: unknown[] = []) => h.as(userId, async (c) => (await c.query(sql, params)).rows);
const fails = async (userId: string | null, sql: string, params: unknown[] = []) => {
  try {
    await h.as(userId, (c) => c.query(sql, params));
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};
const create = async (by: string, fields: Record<string, unknown>) => {
  const cols = ["title", "created_by", "updated_by", ...Object.keys(fields)];
  const vals = [fields.title ?? "Atualizar lista final da Rumo", by, by, ...Object.values(fields)];
  if ("title" in fields) {
    cols.splice(3 + Object.keys(fields).indexOf("title"), 1);
    vals.splice(3 + Object.keys(fields).indexOf("title"), 1);
  }
  const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
  return (await rows(by, `insert into public.work_item (${cols.join(", ")}) values (${ph}) returning id`, vals))[0].id as string;
};
const update = (by: string, id: string, set: string, params: unknown[] = []) =>
  fails(by, `update public.work_item set ${set}, updated_by = $2 where id = $1`, [id, by, ...params]);
const statusOf = async (id: string) => (await h.admin.query("select status, waiting_on, waiting_since, approved_by, completed_at from public.work_item where id = $1", [id])).rows[0];
const events = async (id: string) => (await h.admin.query("select kind, from_value, to_value, note, actor_id from public.work_item_event where item_id = $1 order by id", [id])).rows;

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["member", "member"], ["prof", "advisor"], ["other", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("acesso", () => {
  it("só admin/coordenação criam; membro comum não vê nem cria", async () => {
    const id = await create(ids.admin, { owner_id: ids.admin, due_at: "2026-10-01T14:00:00Z" });
    expect(await rows(ids.coord, "select id from public.work_item where id = $1", [id])).toHaveLength(1);
    expect(await rows(ids.member, "select id from public.work_item")).toHaveLength(0);
    expect(await fails(null, "select id from public.work_item")).toMatch(/permission denied/);
    expect(await fails(ids.member, "insert into public.work_item (title, owner_id, created_by, updated_by) values ('x y', $1, $1, $1)", [ids.member])).toMatch(/row-level security/);
  });

  it("dono fora da coordenação vê só o próprio item, comenta e anda com ele, mas não muda prazo nem dono", async () => {
    const mine = await create(ids.admin, { owner_id: ids.prof, title: "Enviar fotos do laboratório" });
    const notMine = await create(ids.admin, { owner_id: ids.admin, title: "Outro assunto" });
    const seen = await rows(ids.prof, "select id from public.work_item");
    expect(seen.map((r) => r.id)).toEqual([mine]);
    expect(await rows(ids.prof, "select id from public.work_item where id = $1", [notMine])).toHaveLength(0);

    expect(await fails(ids.prof, "insert into public.work_item_comment (item_id, author_id, body) values ($1, $2, 'Enviando hoje.')", [mine, ids.prof])).toBeNull();
    expect(await fails(ids.prof, "insert into public.work_item_comment (item_id, author_id, body) values ($1, $2, 'intruso')", [notMine, ids.prof])).toMatch(/row-level security/);

    expect(await update(ids.prof, mine, "status = 'in_progress'")).toBeNull();
    expect(await update(ids.prof, mine, "due_at = now() + interval '30 days'")).toMatch(/administração e coordenação/);
    expect(await update(ids.prof, mine, "owner_id = $3", [ids.other])).toMatch(/administração e coordenação/);
    expect(await update(ids.other, mine, "status = 'planned'")).toBeNull(); // sem acesso: nenhuma linha afetada
    expect((await statusOf(mine)).status).toBe("in_progress");
  });
});

describe("aprovação", () => {
  it("admin pede aprovação à coordenação; só a aprovadora decide; pedir alteração exige nota e volta para execução", async () => {
    const id = await create(ids.admin, { owner_id: ids.admin, approver_id: ids.coord, title: "Relatório da visita Rumo" });
    expect(await update(ids.admin, id, "status = 'done'")).toMatch(/concluída pela aprovação/);
    expect(await update(ids.admin, id, "status = 'awaiting_approval'")).toBeNull();

    // o dono (mesmo sendo admin) não aprova a própria entrega
    expect(await update(ids.admin, id, "status = 'done'")).toMatch(/só quem foi indicado/);
    expect(await update(ids.coord, id, "status = 'in_progress'")).toMatch(/precisa ser ajustado/);
    expect(await update(ids.coord, id, "status = 'in_progress', status_note = 'Faltou a lista de presença.'")).toBeNull();
    expect((await statusOf(id)).status).toBe("in_progress");

    expect(await update(ids.admin, id, "status = 'awaiting_approval'")).toBeNull();
    expect(await update(ids.coord, id, "status = 'done'")).toBeNull();
    const s = await statusOf(id);
    expect(s.status).toBe("done");
    expect(s.approved_by).toBe(ids.coord);
    expect(s.completed_at).not.toBeNull();

    const log = await events(id);
    expect(log.map((e) => e.kind)).toEqual(["created", "approval_requested", "changes_requested", "approval_requested", "approved"]);
    expect(log.find((e) => e.kind === "changes_requested")).toMatchObject({ note: "Faltou a lista de presença.", actor_id: ids.coord });
    // a nota não fica presa na linha
    expect((await h.admin.query("select status_note from public.work_item where id = $1", [id])).rows[0].status_note).toBe("");
  });

  it("aprovador não pode ser o próprio responsável", async () => {
    const id = await create(ids.admin, { owner_id: ids.admin, approver_id: ids.admin, title: "Autoaprovação" });
    expect(await update(ids.admin, id, "status = 'awaiting_approval'")).toMatch(/não aprova a própria entrega/);
  });

  it("aprovador de fora da coordenação vê e decide só aquele item", async () => {
    const id = await create(ids.coord, { owner_id: ids.admin, approver_id: ids.prof, kind: "approval", title: "Validar portfólio do laboratório", status: "awaiting_approval" });
    expect(await rows(ids.prof, "select id from public.work_item where id = $1", [id])).toHaveLength(1);
    expect(await update(ids.prof, id, "status = 'done'")).toBeNull();
    expect((await statusOf(id)).approved_by).toBe(ids.prof);
  });
});

describe("aguardando, decisão e histórico", () => {
  it("aguardando exige quem; 'desde' é automático e some ao voltar a andar", async () => {
    const id = await create(ids.admin, { owner_id: ids.admin, title: "Confirmar fornecedor" });
    expect(await update(ids.admin, id, "status = 'waiting'")).toMatch(/work_item_waiting_consistency/);
    expect(await update(ids.admin, id, "status = 'waiting', waiting_on = 'supplier', waiting_note = 'Fornecedor de Curitiba'")).toBeNull();
    let s = await statusOf(id);
    expect(s.waiting_on).toBe("supplier");
    expect(s.waiting_since).not.toBeNull();
    expect(await update(ids.admin, id, "status = 'in_progress'")).toBeNull();
    s = await statusOf(id);
    expect(s.waiting_on).toBeNull();
    expect(s.waiting_since).toBeNull();
    expect((await events(id)).map((e) => [e.kind, e.to_value])).toEqual([["created", "planned"], ["status", "waiting"], ["waiting", "supplier"], ["status", "in_progress"]]);
  });

  it("decisão registra quem decidiu e quando; tipo errado é recusado", async () => {
    const id = await create(ids.admin, { owner_id: ids.coord, kind: "decision", title: "Definir data da visita" });
    expect(await update(ids.coord, id, "decision_outcome = '19 de outubro', status = 'done'")).toBeNull();
    const r = (await h.admin.query("select decided_by, decided_at, status from public.work_item where id = $1", [id])).rows[0];
    expect(r).toMatchObject({ decided_by: ids.coord, status: "done" });
    expect(r.decided_at).not.toBeNull();
    const action = await create(ids.admin, { owner_id: ids.admin, title: "Uma ação comum" });
    expect(await update(ids.admin, action, "decision_outcome = 'x'")).toMatch(/só itens do tipo decisão/);
  });

  it("mudanças de prazo e responsável ficam no histórico; histórico não é gravável por ninguém", async () => {
    const id = await create(ids.admin, { owner_id: ids.admin, title: "Revisar FerroCard" });
    expect(await update(ids.coord, id, "due_at = '2026-10-02T12:00:00Z', owner_id = $3", [ids.coord])).toBeNull();
    const kinds = (await events(id)).map((e) => e.kind);
    expect(kinds).toContain("due");
    expect(kinds).toContain("owner");
    expect(await fails(ids.admin, "insert into public.work_item_event (item_id, kind) values ($1, 'forjado')", [id])).toMatch(/row-level security/);
    // sem política de exclusão: nada é apagado (cancelar é o caminho)
    await rows(ids.admin, "delete from public.work_item where id = $1", [id]);
    expect((await h.admin.query("select count(*)::int as n from public.work_item where id = $1", [id])).rows[0].n).toBe(1);
  });

  it("transição inválida é recusada; reabrir concluída é da coordenação", async () => {
    const id = await create(ids.admin, { owner_id: ids.prof, title: "Transição" });
    expect(await update(ids.admin, id, "status = 'inbox'")).toMatch(/transição de ação inválida/);
    expect(await update(ids.prof, id, "status = 'done'")).toBeNull();
    expect(await update(ids.prof, id, "status = 'in_progress'")).toMatch(/reabrir é reservado/);
    expect(await update(ids.admin, id, "status = 'in_progress'")).toBeNull();
  });
});

describe("arquivos", () => {
  it("arquivo vinculado fica visível a quem vê a ação, e só a essa pessoa", async () => {
    const file = (
      await rows(ids.admin, "insert into public.file_asset (provider, external_id, name, mime_type, owner_id, created_by, updated_by) values ('google_drive', 'drive-lista', 'Lista_Rumo.pdf', 'application/pdf', $1, $1, $1) returning id", [ids.admin])
    )[0].id as string;
    const id = await create(ids.admin, { owner_id: ids.prof, title: "Conferir lista" });
    expect(await rows(ids.prof, "select id from public.file_asset where id = $1", [file])).toHaveLength(0);
    expect(await fails(ids.admin, "insert into public.work_item_file (item_id, file_id, linked_by) values ($1, $2, $3)", [id, file, ids.admin])).toBeNull();
    expect(await rows(ids.prof, "select id from public.file_asset where id = $1", [file])).toHaveLength(1);
    expect(await rows(ids.other, "select id from public.file_asset where id = $1", [file])).toHaveLength(0);
    expect((await events(id)).map((e) => [e.kind, e.note])).toContainEqual(["file_linked", "Lista_Rumo.pdf"]);
  });
});

describe("entrada, lembrar depois e decisão com opções (ACT-002)", () => {
  it("item sem responsável nasce na Entrada; aceitar exige responsável; só a coordenação cria na Entrada", async () => {
    const id = (await rows(ids.coord, "insert into public.work_item (title, status, created_by, updated_by) values ('Pesquisar universidades ferroviárias na China', 'inbox', $1, $1) returning id", [ids.coord]))[0].id as string;
    expect(await update(ids.coord, id, "status = 'planned'")).toMatch(/work_item_owner_required/);
    expect(await update(ids.coord, id, "status = 'planned', owner_id = $3, due_at = now() + interval '3 days'", [ids.admin])).toBeNull();
    expect((await events(id)).map((e) => e.kind)).toEqual(expect.arrayContaining(["created", "status", "owner", "due"]));
    expect(await fails(ids.member, "insert into public.work_item (title, status, created_by, updated_by) values ('x y', 'inbox', $1, $1)", [ids.member])).toMatch(/row-level security/);
  });

  it("lembrar depois: o responsável adia o próprio item e isso vai para o histórico", async () => {
    const id = await create(ids.admin, { owner_id: ids.prof, title: "Conversar com Rumo sobre estágio" });
    expect(await update(ids.prof, id, "snoozed_until = '2026-10-05T11:00:00Z'")).toBeNull();
    expect(await update(ids.prof, id, "snoozed_until = null")).toBeNull();
    expect((await events(id)).map((e) => e.kind)).toEqual(["created", "snoozed", "unsnoozed"]);
  });

  it("opções de decisão: até 8, sem opção vazia; quem não é da coordenação não muda as opções", async () => {
    const id = await create(ids.admin, { owner_id: ids.prof, kind: "decision", title: "Data da visita técnica" });
    expect(await update(ids.admin, id, "decision_options = array['12 OUT', '19 OUT']")).toBeNull();
    expect(await update(ids.admin, id, "decision_options = array['12 OUT', '  ']")).toMatch(/work_item_decision_options_valid/);
    expect(await update(ids.admin, id, "decision_options = array['1','2','3','4','5','6','7','8','9']")).toMatch(/work_item_decision_options_valid/);
    expect(await update(ids.prof, id, "decision_options = array['outra']")).toMatch(/administração e coordenação/);
    expect(await update(ids.prof, id, "decision_outcome = '19 OUT', status = 'done'")).toBeNull();
  });

  it("item da Entrada pode ser arquivado sem responsável e reaberto de volta na Entrada", async () => {
    const id = (await rows(ids.admin, "insert into public.work_item (title, status, created_by, updated_by) values ('Ideia solta', 'inbox', $1, $1) returning id", [ids.admin]))[0].id as string;
    expect(await update(ids.admin, id, "status = 'cancelled'")).toBeNull();
    expect(await update(ids.admin, id, "status = 'planned'")).toMatch(/work_item_owner_required/);
    expect(await update(ids.admin, id, "status = 'inbox'")).toBeNull();
  });
});
