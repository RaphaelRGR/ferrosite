import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * CAL-001: calendário ferroviário. Administração/coordenação escrevem no ano corrente e no próximo;
 * anos passados ficam como registro; o público vê só o ano corrente, sem a nota de fonte.
 */
let h: Harness;
const ids: Record<string, string> = {};
let year = 0;
const rows = async (userId: string | null, sql: string, params: unknown[] = []) => h.as(userId, async (c) => (await c.query(sql, params)).rows);
const fails = async (userId: string | null, sql: string, params: unknown[] = []) => {
  try {
    await h.as(userId, (c) => c.query(sql, params));
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};
const insert = (who: string, name: string, date: string) =>
  rows(who, "insert into public.rail_event (name, starts_on, city, country, region, kind, url, source_note, created_by, updated_by) values ($1, $2, 'Berlin', 'DE', 'mundo', 'feira', 'https://example.org', 'site oficial', $3, $3) returning id", [name, date, who]);

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
  year = (await h.admin.query("select public.rail_calendar_year() as y")).rows[0].y;
  // registro de um ano passado, como o operador faria (sem usuário)
  await h.admin.query("insert into public.rail_event (name, starts_on, created_by, updated_by) values ('Evento antigo', $1, $2, $2)", [`${year - 1}-05-10`, ids.admin]);
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("calendário ferroviário", () => {
  it("coordenação cadastra no ano atual e no próximo; não em outro ano", async () => {
    await insert(ids.coord, "Feira deste ano", `${year}-09-22`);
    await insert(ids.admin, "Feira do ano que vem", `${year + 1}-03-01`);
    expect(await fails(ids.admin, "insert into public.rail_event (name, starts_on, created_by, updated_by) values ('X', $1, $2, $2)", [`${year + 2}-01-10`, ids.admin])).toMatch(/só dá para cadastrar eventos/);
  });

  it("ano passado é registro: não edita nem remove", async () => {
    const [old] = await rows(ids.admin, "select id from public.rail_event where name = 'Evento antigo'");
    expect(await fails(ids.admin, "update public.rail_event set name = 'Mudado', updated_by = $2 where id = $1", [old.id, ids.admin])).toMatch(/é registro/);
    expect(await fails(ids.admin, "delete from public.rail_event where id = $1", [old.id])).toMatch(/é registro/);
    // e não dá para "mover" um evento atual para o passado
    const [cur] = await rows(ids.admin, "select id from public.rail_event where name = 'Feira deste ano'");
    expect(await fails(ids.admin, "update public.rail_event set starts_on = $2, updated_by = $3 where id = $1", [cur.id, `${year - 1}-12-01`, ids.admin])).toMatch(/só dá para cadastrar/);
  });

  it("membro não vê nem escreve; anônimo vê só o ano corrente e sem a nota de fonte", async () => {
    expect(await rows(ids.member, "select id from public.rail_event")).toHaveLength(0);
    expect(await fails(ids.member, "insert into public.rail_event (name, starts_on, created_by, updated_by) values ('X', $1, $2, $2)", [`${year}-06-01`, ids.member])).toMatch(/row-level security/);
    expect(await fails(null, "select * from public.rail_event")).toMatch(/permission denied/);
    const pub = await rows(null, "select * from public.public_rail_event");
    expect(pub.map((r) => r.name)).toEqual(["Feira deste ano"]);
    expect(pub[0]).not.toHaveProperty("source_note");
  });

  it("remover no ano atual fica auditado", async () => {
    const [cur] = await rows(ids.coord, "select id from public.rail_event where name = 'Feira deste ano'");
    await rows(ids.coord, "delete from public.rail_event where id = $1", [cur.id]);
    const audit = await h.admin.query("select action from public.audit_event where target_id = $1", [cur.id]);
    expect(audit.rows.map((r) => r.action)).toContain("rail_event.deleted");
  });
});
