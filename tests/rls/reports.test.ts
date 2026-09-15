import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * REPORT-001 (19): fórmula única, período com timezone declarado, "sem dados"
 * (null) para indicadores sem fonte, snapshots imutáveis e auditados, acesso
 * restrito a coordenação/administração.
 */
let h: Harness;
const ids: Record<string, string> = {};
let projectId = "";

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
  for (const [key, role] of [["coord", "coordination"], ["leader", "member"], ["member", "member"], ["advisor", "advisor"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
  projectId = (await rows(ids.coord, "insert into public.project (slug, name, created_by, updated_by) values ('p', 'Projeto', $1, $1) returning id", [ids.coord]))[0].id;
  await rows(ids.coord, "update public.project set status = 'active', updated_by = $2 where id = $1", [projectId, ids.coord]);
  await rows(ids.coord, "insert into public.project_membership (project_id, profile_id, role) values ($1, $2, 'leader'), ($1, $3, 'member')", [projectId, ids.leader, ids.member]);
  // missão com prazo já vencido, concluída via fluxo (planejada → execução → validação → concluída)
  const m = (await rows(ids.member, "insert into public.mission (project_id, title, due_at, created_by, updated_by) values ($1, 'M1', now() - interval '2 days', $2, $2) returning id", [projectId, ids.member]))[0].id;
  for (const s of ["in_progress", "in_validation"]) await rows(ids.member, "update public.mission set status = $2, updated_by = $3 where id = $1", [m, s, ids.member]);
  await rows(ids.leader, "update public.mission set status = 'done', updated_by = $2 where id = $1", [m, ids.leader]);
  // missão aberta e vencida
  await rows(ids.member, "insert into public.mission (project_id, title, due_at, created_by, updated_by) values ($1, 'M2', now() - interval '1 day', $2, $2)", [projectId, ids.member]);
  // missão aberta sem prazo (fora do denominador)
  await rows(ids.member, "insert into public.mission (project_id, title, created_by, updated_by) values ($1, 'M3', $2, $2)", [projectId, ids.member]);
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("indicadores (19)", () => {
  it("só coordenação/administração calcula; membro e orientador não", async () => {
    expect(await fails(ids.member, "select public.compute_indicators(current_date - 30, current_date)")).toMatch(/indicadores são da coordenação/);
    expect(await fails(ids.advisor, "select public.compute_indicators(current_date - 30, current_date)")).toMatch(/indicadores são da coordenação/);
    expect(await fails(ids.coord, "select public.compute_indicators(current_date, current_date - 1)")).toMatch(/período inválido/);
  });

  it("fórmulas: transições contam concluídas; atraso publica numerador/denominador; sem fonte = null", async () => {
    const [{ data }] = await rows(ids.coord, "select public.compute_indicators(current_date - 30, current_date) as data");
    const ind = Object.fromEntries((data.indicators as Array<{ id: string; value: unknown; numerator?: number; denominator?: number; source: string | null }>).map((x) => [x.id, x]));
    expect(data.period.timezone).toBe("America/Sao_Paulo");
    expect(ind.active_projects.value).toBe(1);
    expect(ind.missions_done.value).toBe(1);
    expect(ind.late_rate.numerator).toBe(2); // concluída após o prazo + aberta vencida
    expect(ind.late_rate.denominator).toBe(2); // M1 e M2 têm prazo; M3 não
    expect(ind.late_rate.value).toBe(1);
    expect(ind.students_involved.value).toBe(2);
    expect(ind.visits_done.value).toBeNull();
    expect(ind.visits_done.source).toBeNull();
    expect(ind.hours_logged.value).toBeNull();
    expect(ind.funding.value).toBeNull();
    expect(ind.challenges_funnel.value).toEqual({ received: 0, screened: 0, accepted: 0 });
    expect(ind.organizations_involved.value).toBe(0);
  });

  it("período sem atividade: concluídas 0 (não null) porque a fonte existe", async () => {
    const [{ data }] = await rows(ids.coord, "select public.compute_indicators(date '2000-01-01', date '2000-01-31') as data");
    const done = (data.indicators as Array<{ id: string; value: unknown }>).find((x) => x.id === "missions_done");
    expect(done?.value).toBe(0);
  });

  it("snapshot: imutável, auditado, só overseers leem; dados operacionais mudando não alteram o snapshot", async () => {
    const [{ id }] = await rows(ids.coord, "select public.snapshot_indicators(current_date - 30, current_date) as id");
    expect(await rows(ids.member, "select id from public.report_snapshot")).toHaveLength(0);
    const snap = await rows(ids.coord, "select data, formulas_version from public.report_snapshot where id = $1", [id]);
    expect(snap[0].formulas_version).toBe(1);
    const before = (snap[0].data.indicators as Array<{ id: string; value: number }>).find((x) => x.id === "active_projects")!.value;
    await rows(ids.coord, "update public.project set status = 'paused', updated_by = $2 where id = $1", [projectId, ids.coord]);
    const after = await rows(ids.coord, "select data from public.report_snapshot where id = $1", [id]);
    expect((after[0].data.indicators as Array<{ id: string; value: number }>).find((x) => x.id === "active_projects")!.value).toBe(before);
    const live = await rows(ids.coord, "select public.compute_indicators(current_date - 30, current_date) as data");
    expect((live[0].data.indicators as Array<{ id: string; value: number }>).find((x) => x.id === "active_projects")!.value).toBe(0);
    // sem policy de UPDATE: 0 linhas para autenticado; superusuário/service role: trigger barra
    await rows(ids.coord, "update public.report_snapshot set data = '{}' where id = $1", [id]);
    expect((await h.admin.query("select data from public.report_snapshot where id = $1", [id])).rows[0].data).not.toEqual({});
    await expect(h.admin.query("update public.report_snapshot set data = '{}' where id = $1", [id])).rejects.toThrow(/exclusão não permitida/);
    await expect(h.admin.query("delete from public.report_snapshot where id = $1", [id])).rejects.toThrow(/exclusão não permitida/);
    const audit = await h.admin.query("select action, actor_id from public.audit_event where action = 'report.snapshot'");
    expect(audit.rows).toEqual([{ action: "report.snapshot", actor_id: ids.coord }]);
  });
});
