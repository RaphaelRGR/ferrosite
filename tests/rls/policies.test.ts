import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * Isolamento e menor privilégio (11/21) exercitando as migrations reais em um
 * Postgres embutido. Cada consulta roda como o usuário indicado, com RLS.
 */
let h: Harness;
const ids: Record<string, string> = {};
let projectId = "";
let missionId = "";

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
  // Provisionamento inicial sem sessão (service role / SQL): guard liberado.
  ids.admin = await h.createUser("admin@test.invalid", "Admin");
  ids.coord = await h.createUser("coord@test.invalid", "Coord");
  ids.leader = await h.createUser("leader@test.invalid", "Líder");
  ids.member = await h.createUser("member@test.invalid", "Membro");
  ids.outsider = await h.createUser("outsider@test.invalid", "Forasteiro");
  ids.pending = await h.createUser("pending@test.invalid", "Pendente");
  ids.external = await h.createUser("external@test.invalid", "Externo");
  ids.disabled = await h.createUser("disabled@test.invalid", "Desativado");

  const activate = (id: string, role: string, status = "active") =>
    h.admin.query("update public.profile set global_role = $2, status = $3 where id = $1", [id, role, status]);
  await activate(ids.admin, "admin");
  await activate(ids.coord, "coordination");
  await activate(ids.leader, "member");
  await activate(ids.member, "member");
  await activate(ids.outsider, "member");
  await activate(ids.external, "external");
  await activate(ids.disabled, "member", "disabled");
  // ids.pending permanece pendente/viewer (default do trigger)

  const p = await rows(
    ids.admin,
    "insert into public.project (slug, name, created_by, updated_by) values ('projeto-a', 'Projeto A', $1, $1) returning id",
    [ids.admin],
  );
  projectId = p[0].id;
  await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'leader', $3)", [projectId, ids.leader, ids.admin]);
  await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'member', $3)", [projectId, ids.member, ids.admin]);
  await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'member', $3)", [projectId, ids.pending, ids.admin]);
  await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'member', $3)", [projectId, ids.disabled, ids.admin]);
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("perfil", () => {
  it("nasce pendente/viewer via trigger e com preferências", async () => {
    const r = await h.admin.query("select status, global_role from public.profile where id = $1", [ids.pending]);
    expect(r.rows[0]).toEqual({ status: "pending", global_role: "viewer" });
    const pref = await h.admin.query("select theme from public.user_preference where profile_id = $1", [ids.pending]);
    expect(pref.rows[0].theme).toBe("system");
  });

  it("cada um lê o próprio perfil; membro só vê colegas de projeto; admin vê todos", async () => {
    expect(await rows(ids.outsider, "select id from public.profile")).toHaveLength(1);
    const seenByMember = (await rows(ids.member, "select id from public.profile")).map((r) => r.id);
    expect(seenByMember).toEqual(expect.arrayContaining([ids.member, ids.leader]));
    expect(seenByMember).not.toContain(ids.outsider);
    expect((await rows(ids.admin, "select id from public.profile")).length).toBe(Object.keys(ids).length);
  });

  it("usuário não promove a si mesmo; admin promove; último admin não é rebaixado", async () => {
    expect(await fails(ids.member, "update public.profile set global_role = 'admin' where id = $1", [ids.member])).toMatch(/administradores/);
    await rows(ids.admin, "update public.profile set global_role = 'coordination' where id = $1", [ids.outsider]);
    expect(await fails(ids.admin, "update public.profile set global_role = 'member' where id = $1", [ids.admin])).toMatch(/último administrador/);
    await rows(ids.admin, "update public.profile set global_role = 'member' where id = $1", [ids.outsider]);
    expect(await fails(ids.member, "update public.profile set email = 'x@y.z', full_name = 'Novo' where id = $1", [ids.member])).toBeNull();
    const r = await h.admin.query("select email, full_name from public.profile where id = $1", [ids.member]);
    expect(r.rows[0]).toEqual({ email: "member@test.invalid", full_name: "Novo" });
  });
});

describe("projeto e membership", () => {
  it("anônimo não lê nada", async () => {
    for (const t of ["profile", "project", "project_membership", "mission", "audit_event"]) {
      const err = await fails(null, `select * from public.${t}`);
      expect(err, t).toMatch(/permission denied/);
    }
  });

  it("forasteiro não vê o projeto nem consegue entrar sozinho", async () => {
    expect(await rows(ids.outsider, "select id from public.project where id = $1", [projectId])).toEqual([]);
    expect(await fails(ids.outsider, "insert into public.project_membership (project_id, profile_id) values ($1, $2)", [projectId, ids.outsider])).toMatch(/row-level security/);
  });

  it("membro comum não cria projeto; orientador/coordenação criam", async () => {
    expect(await fails(ids.member, "insert into public.project (slug, name, created_by, updated_by) values ('x', 'X', $1, $1)", [ids.member])).toMatch(/row-level security/);
    expect(await fails(ids.coord, "insert into public.project (slug, name, created_by, updated_by) values ('projeto-b', 'Projeto B', $1, $1)", [ids.coord])).toBeNull();
  });

  it("líder gere membership do próprio projeto; membro não", async () => {
    expect(await fails(ids.member, "update public.project_membership set role = 'leader' where project_id = $1 and profile_id = $2", [projectId, ids.member])).toBeNull();
    const still = await h.admin.query("select role from public.project_membership where project_id = $1 and profile_id = $2", [projectId, ids.member]);
    expect(still.rows[0].role).toBe("member"); // UPDATE sem linha visível pela policy: 0 linhas afetadas
    expect(await fails(ids.leader, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'viewer', $3)", [projectId, ids.outsider, ids.leader])).toBeNull();
    await rows(ids.leader, "delete from public.project_membership where project_id = $1 and profile_id = $2", [projectId, ids.outsider]);
  });

  it("pendente e desativado não veem o projeto mesmo com membership", async () => {
    expect(await rows(ids.pending, "select id from public.project")).toEqual([]);
    expect(await rows(ids.disabled, "select id from public.project")).toEqual([]);
  });

  it("externo exige prazo; expirado perde acesso; vigente acessa", async () => {
    expect(await fails(ids.admin, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'external')", [projectId, ids.external])).toMatch(/membership_external_expires/);
    await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role, expires_at) values ($1, $2, 'external', now() - interval '1 minute')", [projectId, ids.external]);
    expect(await rows(ids.external, "select id from public.project")).toEqual([]);
    await rows(ids.admin, "update public.project_membership set expires_at = now() + interval '1 day' where project_id = $1 and profile_id = $2", [projectId, ids.external]);
    expect(await rows(ids.external, "select id from public.project")).toHaveLength(1);
  });

  it("projeto não pode ser apagado, só arquivado, e o arquivamento é consistente", async () => {
    // Sem policy de DELETE o Postgres não erra: afeta 0 linhas. O projeto precisa continuar existindo.
    await rows(ids.admin, "delete from public.project where id = $1", [projectId]);
    expect(await h.admin.query("select 1 from public.project where id = $1", [projectId])).toMatchObject({ rowCount: 1 });
    expect(await fails(ids.admin, "update public.project set status = 'archived' where id = $1", [projectId])).toMatch(/project_archived_consistency/);
  });
});

describe("missão", () => {
  it("líder e membro criam; forasteiro e visualizador não", async () => {
    const m = await rows(ids.member, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'Missão 1', $2, $2) returning id", [projectId, ids.member]);
    missionId = m[0].id;
    expect(await fails(ids.outsider, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'Invasão', $2, $2)", [projectId, ids.outsider])).toMatch(/row-level security/);
    await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'viewer')", [projectId, ids.outsider]);
    expect(await fails(ids.outsider, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'Visualizador', $2, $2)", [projectId, ids.outsider])).toMatch(/row-level security/);
    expect(await rows(ids.outsider, "select id from public.mission")).toHaveLength(1);
  });

  it("autor edita; outro membro sem atribuição não; responsável atribuído edita", async () => {
    expect(await fails(ids.member, "update public.mission set title = 'Editada', updated_by = $2 where id = $1", [missionId, ids.member])).toBeNull();
    await h.as(ids.leader, (c) => c.query("update public.mission set title = 'Líder', updated_by = $2 where id = $1", [missionId, ids.leader]));
    const other = await h.createUser("other@test.invalid");
    await h.admin.query("update public.profile set status = 'active', global_role = 'member' where id = $1", [other]);
    await rows(ids.admin, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'member')", [projectId, other]);
    const before = await h.admin.query("select title, version from public.mission where id = $1", [missionId]);
    await rows(other, "update public.mission set title = 'Alheia', updated_by = $2 where id = $1", [missionId, other]);
    const after = await h.admin.query("select title, version from public.mission where id = $1", [missionId]);
    expect(after.rows[0]).toEqual(before.rows[0]); // 0 linhas afetadas
    await rows(ids.leader, "insert into public.mission_assignee (mission_id, profile_id) values ($1, $2)", [missionId, other]);
    await rows(other, "update public.mission set title = 'Responsável', updated_by = $2 where id = $1", [missionId, other]);
    const done = await h.admin.query("select title, version from public.mission where id = $1", [missionId]);
    expect(done.rows[0].title).toBe("Responsável");
    expect(done.rows[0].version).toBe(before.rows[0].version + 1);
  });
});

describe("auditoria", () => {
  it("membership e privilégios geram eventos; só overseers leem; ninguém altera", async () => {
    const events = await rows(ids.coord, "select action from public.audit_event where target_type = 'project_membership'");
    expect(events.map((e) => e.action)).toEqual(expect.arrayContaining(["membership.insert", "membership.update", "membership.delete"]));
    const priv = await rows(ids.admin, "select count(*)::int as n from public.audit_event where action = 'profile.privileges_changed'");
    expect(priv[0].n).toBeGreaterThan(0);
    expect(await rows(ids.leader, "select id from public.audit_event")).toEqual([]);
    const before = (await h.admin.query("select count(*)::int as n, count(*) filter (where action = 'x')::int as x from public.audit_event")).rows[0];
    await rows(ids.admin, "delete from public.audit_event");
    await rows(ids.admin, "update public.audit_event set action = 'x'");
    const after = (await h.admin.query("select count(*)::int as n, count(*) filter (where action = 'x')::int as x from public.audit_event")).rows[0];
    expect(after).toEqual(before); // append-only: nada apagado nem alterado
    expect(await fails(ids.member, "insert into public.audit_event (action, target_type) values ('forjado', 'x')")).toMatch(/permission denied|row-level security/);
  });
});
