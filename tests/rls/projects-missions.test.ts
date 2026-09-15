import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * AUTH-003 / PORTAL-002 / PORTAL-003 (10, 11): matriz positiva e negativa,
 * cross-project por ID, máquinas de estado no servidor, concorrência por
 * versão, responsável ∈ equipe, remoção com missão aberta, grant externo
 * expirado, histórico com ator/origem/destino e busca de perfil com escopo.
 */
let h: Harness;
const ids: Record<string, string> = {};
let projectA = "";
let projectB = "";

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
const setStatus = (userId: string, table: "project" | "mission", id: string, status: string) =>
  fails(userId, `update public.${table} set status = $2, updated_by = $3 where id = $1`, [id, status, userId]);

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [
    ["admin", "admin"], ["coord", "coordination"], ["advisor", "advisor"], ["leaderA", "member"], ["memberA", "member"],
    ["memberA2", "member"], ["leaderB", "member"], ["external", "external"], ["viewer", "viewer"],
  ] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
  const mk = async (slug: string) =>
    (await rows(ids.coord, "insert into public.project (slug, name, created_by, updated_by) values ($1, $1, $2, $2) returning id", [slug, ids.coord]))[0].id as string;
  projectA = await mk("projeto-a");
  projectB = await mk("projeto-b");
  const add = (p: string, u: string, role: string, expires: string | null = null) =>
    rows(ids.coord, "insert into public.project_membership (project_id, profile_id, role, expires_at, granted_by) values ($1, $2, $3, $4, $5)", [p, u, role, expires, ids.coord]);
  await add(projectA, ids.leaderA, "leader");
  await add(projectA, ids.memberA, "member");
  await add(projectA, ids.memberA2, "member");
  await add(projectA, ids.viewer, "viewer");
  await add(projectB, ids.leaderB, "leader");
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("matriz e isolamento (11)", () => {
  it("criar projeto: admin, coordenação e orientador sim; membro, externo e visualizador não", async () => {
    for (const who of ["admin", "advisor"]) {
      expect(await fails(ids[who], "insert into public.project (slug, name, created_by, updated_by) values ($1, 'Novo', $2, $2)", [`p-${who}`, ids[who]])).toBeNull();
    }
    for (const who of ["memberA", "leaderA", "external", "viewer"]) {
      expect(await fails(ids[who], "insert into public.project (slug, name, created_by, updated_by) values ($1, 'Novo', $2, $2)", [`p-${who}`, ids[who]])).toMatch(/row-level security/);
    }
  });

  it("cross-project por ID: líder de B não vê, edita nem cria missão em A; overseers veem tudo", async () => {
    expect(await rows(ids.leaderB, "select id from public.project where id = $1", [projectA])).toHaveLength(0);
    expect(await rows(ids.leaderB, "select id from public.project")).toHaveLength(1);
    expect(await rows(ids.coord, "select id from public.project")).toHaveLength(4);
    await rows(ids.leaderB, "update public.project set name = 'Invasão', updated_by = $2 where id = $1", [projectA, ids.leaderB]);
    expect((await h.admin.query("select name from public.project where id = $1", [projectA])).rows[0].name).toBe("projeto-a");
    expect(await fails(ids.leaderB, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'Invasão', $2, $2)", [projectA, ids.leaderB])).toMatch(/row-level security/);
    expect(await fails(ids.leaderB, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'member')", [projectA, ids.leaderB])).toMatch(/row-level security/);
  });

  it("visualizador do projeto lê mas não cria missão nem gere equipe", async () => {
    expect(await rows(ids.viewer, "select id from public.project where id = $1", [projectA])).toHaveLength(1);
    expect(await fails(ids.viewer, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'v', $2, $2)", [projectA, ids.viewer])).toMatch(/row-level security/);
    expect(await fails(ids.viewer, "update public.project_membership set role = 'leader' where project_id = $1 and profile_id = $2", [projectA, ids.viewer])).toBeNull();
    expect((await h.admin.query("select role from public.project_membership where project_id = $1 and profile_id = $2", [projectA, ids.viewer])).rows[0].role).toBe("viewer");
  });

  it("grant externo: exige prazo; expirado perde acesso; ativo dentro do prazo acessa", async () => {
    expect(await fails(ids.leaderA, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'external')", [projectA, ids.external])).toMatch(/membership_external_expires/);
    await rows(ids.leaderA, "insert into public.project_membership (project_id, profile_id, role, expires_at) values ($1, $2, 'external', now() + interval '1 day')", [projectA, ids.external]);
    expect(await rows(ids.external, "select id from public.project where id = $1", [projectA])).toHaveLength(1);
    await h.admin.query("update public.project_membership set expires_at = now() - interval '1 minute' where project_id = $1 and profile_id = $2", [projectA, ids.external]);
    expect(await rows(ids.external, "select id from public.project where id = $1", [projectA])).toHaveLength(0);
  });

  it("busca de perfil por e-mail: líder/overseer sim (mínimo + auditoria); membro comum não", async () => {
    const found = await rows(ids.leaderA, "select * from public.find_profile_by_email($1)", ["MemberA2@test.invalid"]);
    expect(found).toHaveLength(1);
    expect(Object.keys(found[0]).sort()).toEqual(["email", "full_name", "id", "status"]);
    expect(await fails(ids.memberA, "select * from public.find_profile_by_email($1)", ["leaderB@test.invalid"])).toMatch(/sem permissão/);
    const audit = await h.admin.query("select actor_id from public.audit_event where action = 'profile.lookup' and target_id = $1", ["membera2@test.invalid"]);
    expect(audit.rowCount).toBe(1);
    expect(audit.rows[0].actor_id).toBe(ids.leaderA);
  });
});

describe("máquina de estados do projeto (10)", () => {
  it("transições válidas seguem a cadeia; inválidas falham no servidor", async () => {
    expect(await setStatus(ids.leaderA, "project", projectA, "completed")).toMatch(/inválida: planned → completed/);
    expect(await setStatus(ids.leaderA, "project", projectA, "active")).toBeNull();
    expect(await setStatus(ids.leaderA, "project", projectA, "paused")).toBeNull();
    expect(await setStatus(ids.leaderA, "project", projectA, "completed")).toMatch(/inválida: paused → completed/);
    expect(await setStatus(ids.leaderA, "project", projectA, "active")).toBeNull();
    expect(await setStatus(ids.leaderA, "project", projectA, "completed")).toBeNull();
    expect(await setStatus(ids.leaderA, "project", projectA, "archived")).toBeNull();
    const { rows: r } = await h.admin.query("select status, archived_at from public.project where id = $1", [projectA]);
    expect(r[0].status).toBe("archived");
    expect(r[0].archived_at).not.toBeNull();
  });

  it("arquivado continua consultável; reativar é só de overseer e fica auditado", async () => {
    expect(await rows(ids.memberA, "select id from public.project where id = $1", [projectA])).toHaveLength(1);
    expect(await setStatus(ids.leaderA, "project", projectA, "active")).toMatch(/apenas coordenação\/administração reativa/);
    expect(await setStatus(ids.coord, "project", projectA, "active")).toBeNull();
    const { rows: r } = await h.admin.query("select status, archived_at from public.project where id = $1", [projectA]);
    expect(r[0]).toEqual({ status: "active", archived_at: null });
    const audit = await h.admin.query("select action from public.audit_event where target_type = 'project' and target_id = $1 order by id", [projectA]);
    expect(audit.rows.map((x) => x.action)).toEqual(["project.archived", "project.reactivated"]);
    const hist = await rows(ids.memberA, "select kind, from_value, to_value, actor_id from public.activity_event where project_id = $1 and kind = 'project.status' order by id", [projectA]);
    expect(hist.map((x) => `${x.from_value}>${x.to_value}`)).toEqual(["planned>active", "active>paused", "paused>active", "active>completed", "completed>archived", "archived>active"]);
    expect(hist.at(-1)?.actor_id).toBe(ids.coord);
  });

  it("cancelado é terminal", async () => {
    const id = (await rows(ids.coord, "insert into public.project (slug, name, created_by, updated_by) values ('cancelavel', 'Cancelável', $1, $1) returning id", [ids.coord]))[0].id;
    expect(await setStatus(ids.coord, "project", id, "cancelled")).toBeNull();
    expect(await setStatus(ids.coord, "project", id, "active")).toMatch(/inválida: cancelled → active/);
  });

  it("edição concorrente: versão avança e um UPDATE com versão antiga não afeta linhas", async () => {
    const v0 = (await h.admin.query("select version from public.project where id = $1", [projectA])).rows[0].version as number;
    const first = await h.as(ids.leaderA, (c) => c.query("update public.project set summary = 'A', updated_by = $2 where id = $1 and version = $3", [projectA, ids.leaderA, v0]));
    expect(first.rowCount).toBe(1);
    const second = await h.as(ids.coord, (c) => c.query("update public.project set summary = 'B', updated_by = $2 where id = $1 and version = $3", [projectA, ids.coord, v0]));
    expect(second.rowCount).toBe(0);
    const { rows: r } = await h.admin.query("select summary, version from public.project where id = $1", [projectA]);
    expect(r[0]).toEqual({ summary: "A", version: v0 + 1 });
  });
});

describe("missões (10)", () => {
  let missionId = "";

  it("criação registra histórico; responsável precisa ser membro vigente do projeto", async () => {
    missionId = (await rows(ids.memberA, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'Missão', $2, $2) returning id", [projectA, ids.memberA]))[0].id;
    const created = await rows(ids.memberA, "select kind, to_value, actor_id from public.activity_event where mission_id = $1", [missionId]);
    expect(created).toEqual([{ kind: "mission.created", to_value: "planned", actor_id: ids.memberA }]);
    expect(await fails(ids.memberA, "insert into public.mission_assignee (mission_id, profile_id) values ($1, $2)", [missionId, ids.leaderB])).toMatch(/responsável precisa ser membro ativo/);
    expect(await fails(ids.memberA, "insert into public.mission_assignee (mission_id, profile_id) values ($1, $2)", [missionId, ids.memberA2])).toBeNull();
    expect(await fails(ids.memberA, "insert into public.mission_assignee (mission_id, profile_id) values ($1, $2)", [missionId, ids.coord])).toBeNull();
  });

  it("fluxo: planejada → execução → validação → concluída; membro não valida; líder valida e reabre", async () => {
    expect(await setStatus(ids.memberA2, "mission", missionId, "in_validation")).toMatch(/inválida: planned → in_validation/);
    expect(await setStatus(ids.memberA2, "mission", missionId, "in_progress")).toBeNull();
    expect(await setStatus(ids.memberA2, "mission", missionId, "done")).toMatch(/inválida: in_progress → done/);
    expect(await setStatus(ids.memberA2, "mission", missionId, "in_validation")).toBeNull();
    expect(await setStatus(ids.memberA2, "mission", missionId, "done")).toMatch(/reservada ao líder/);
    expect(await setStatus(ids.leaderA, "mission", missionId, "done")).toBeNull();
    const done = (await h.admin.query("select completed_at from public.mission where id = $1", [missionId])).rows[0];
    expect(done.completed_at).not.toBeNull();
    expect(await setStatus(ids.memberA2, "mission", missionId, "in_progress")).toMatch(/reabrir missão/);
    expect(await setStatus(ids.leaderA, "mission", missionId, "in_progress")).toBeNull();
    expect((await h.admin.query("select completed_at from public.mission where id = $1", [missionId])).rows[0].completed_at).toBeNull();
    const hist = await rows(ids.viewer, "select from_value, to_value, actor_id from public.activity_event where mission_id = $1 and kind = 'mission.status' order by id", [missionId]);
    expect(hist.map((x) => `${x.from_value}>${x.to_value}`)).toEqual(["planned>in_progress", "in_progress>in_validation", "in_validation>done", "done>in_progress"]);
    expect(hist[2].actor_id).toBe(ids.leaderA);
  });

  it("pausar/cancelar só líder ou overseer; cancelada é terminal; missão não muda de projeto", async () => {
    expect(await setStatus(ids.memberA2, "mission", missionId, "paused")).toMatch(/reservada ao líder/);
    expect(await setStatus(ids.leaderA, "mission", missionId, "paused")).toBeNull();
    expect(await setStatus(ids.leaderA, "mission", missionId, "in_progress")).toBeNull();
    expect(await fails(ids.leaderA, "update public.mission set project_id = $2, updated_by = $3 where id = $1", [missionId, projectB, ids.leaderA])).toMatch(/não pode mudar de projeto/);
    const other = (await rows(ids.memberA, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'Cancelável', $2, $2) returning id", [projectA, ids.memberA]))[0].id;
    expect(await setStatus(ids.coord, "mission", other, "cancelled")).toBeNull();
    expect(await setStatus(ids.coord, "mission", other, "in_progress")).toMatch(/inválida: cancelled → in_progress/);
  });

  it("remover membro com missão aberta exige reatribuição; depois de reatribuir, remove", async () => {
    expect(await fails(ids.leaderA, "update public.project_membership set status = 'removed' where project_id = $1 and profile_id = $2", [projectA, ids.memberA2])).toMatch(/1 missão\(ões\) aberta/);
    expect(await fails(ids.leaderA, "delete from public.project_membership where project_id = $1 and profile_id = $2", [projectA, ids.memberA2])).toMatch(/aberta/);
    await rows(ids.leaderA, "delete from public.mission_assignee where mission_id = $1 and profile_id = $2", [missionId, ids.memberA2]);
    expect(await fails(ids.leaderA, "update public.project_membership set status = 'removed' where project_id = $1 and profile_id = $2", [projectA, ids.memberA2])).toBeNull();
    expect(await rows(ids.memberA2, "select id from public.project where id = $1", [projectA])).toHaveLength(0);
  });

  it("checklist e comentários: membros leem; gestão por quem gere a missão; comentário só do autor", async () => {
    expect(await fails(ids.memberA, "insert into public.mission_checklist_item (mission_id, label, created_by) values ($1, 'Item', $2)", [missionId, ids.memberA])).toBeNull();
    expect(await fails(ids.viewer, "insert into public.mission_checklist_item (mission_id, label, created_by) values ($1, 'Item v', $2)", [missionId, ids.viewer])).toMatch(/row-level security/);
    expect(await rows(ids.viewer, "select id from public.mission_checklist_item where mission_id = $1", [missionId])).toHaveLength(1);
    expect(await fails(ids.viewer, "insert into public.mission_comment (mission_id, author_id, body) values ($1, $2, 'oi')", [missionId, ids.viewer])).toBeNull();
    expect(await fails(ids.viewer, "insert into public.mission_comment (mission_id, author_id, body) values ($1, $2, 'falso')", [missionId, ids.memberA])).toMatch(/row-level security/);
    expect(await fails(ids.leaderB, "select id from public.mission_comment where mission_id = $1", [missionId])).toBeNull();
    expect(await rows(ids.leaderB, "select id from public.mission_comment where mission_id = $1", [missionId])).toHaveLength(0);
    await rows(ids.memberA, "update public.mission_comment set body = 'editado' where mission_id = $1", [missionId]);
    expect((await h.admin.query("select body from public.mission_comment where mission_id = $1", [missionId])).rows[0].body).toBe("oi");
  });

  it("histórico é somente leitura para autenticados (sem insert/update/delete direto)", async () => {
    expect(await fails(ids.leaderA, "insert into public.activity_event (project_id, kind) values ($1, 'forjado')", [projectA])).toMatch(/row-level security/);
    await rows(ids.leaderA, "delete from public.activity_event where project_id = $1", [projectA]);
    expect((await h.admin.query("select count(*)::int as n from public.activity_event where project_id = $1", [projectA])).rows[0].n).toBeGreaterThan(5);
    expect(await fails(ids.leaderA, "select public.log_activity($1, null, 'forjado')", [projectA])).toMatch(/permission denied/);
  });
});
