import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * CRM-001 (13/14/21): CRM restrito a coordenação/administração; orientador só
 * vê desafios atribuídos; pipeline com motivo em perdido/pausado e histórico;
 * parceiro público exige autorização de marca e overseer (auditado); envio do
 * formulário só pelo service role, com limite, protocolo e auditoria sem PII.
 */
let h: Harness;
const ids: Record<string, string> = {};
let orgId = "";

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
const submit = (email: string, hash = "hash-a") =>
  h.asService(async (c) =>
    (await c.query("select public.submit_research_challenge($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) as protocol", [
      "Empresa Teste", "Pessoa Teste", email, "", "Desgaste prematuro de rodas", "Descrição longa o suficiente do problema técnico para triagem.", ["material-rodante", "materiais"], true, "pt", hash,
    ])).rows[0].protocol as string,
  );

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["advisor", "advisor"], ["member", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = 'active' where id = $1", [ids[key], role]);
  }
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("organizações e pipeline (13)", () => {
  it("coordenação cria; membro e orientador não veem nem criam", async () => {
    orgId = (await rows(ids.coord, "insert into public.organization (name, kind, created_by, updated_by) values ('ACME Ferrovias', 'company', $1, $1) returning id", [ids.coord]))[0].id;
    expect(await rows(ids.member, "select id from public.organization")).toHaveLength(0);
    expect(await rows(ids.advisor, "select id from public.organization")).toHaveLength(0);
    expect(await fails(ids.member, "insert into public.organization (name, created_by, updated_by) values ('X Corp', $1, $1)", [ids.member])).toMatch(/row-level security/);
    expect(await rows(ids.admin, "select id from public.organization")).toHaveLength(1);
  });

  it("contatos e interações ficam restritos; interação registra autor", async () => {
    const contact = (await rows(ids.coord, "insert into public.contact (organization_id, full_name, email, created_by) values ($1, 'Contato Um', 'c1@acme.invalid', $2) returning id", [orgId, ids.coord]))[0].id;
    await rows(ids.coord, "insert into public.relationship_activity (organization_id, contact_id, kind, summary, created_by) values ($1, $2, 'meeting', 'Reunião inicial', $3)", [orgId, contact, ids.coord]);
    expect(await rows(ids.member, "select id from public.contact")).toHaveLength(0);
    expect(await rows(ids.member, "select id from public.relationship_activity")).toHaveLength(0);
    expect(await fails(ids.coord, "insert into public.relationship_activity (organization_id, kind, summary, created_by) values ($1, 'note', 'forjado', $2)", [orgId, ids.admin])).toMatch(/row-level security/);
  });

  it("pipeline: transição registra ator/data; perdido/pausado exigem motivo", async () => {
    expect(await fails(ids.coord, "update public.organization set stage = 'lost', updated_by = $2 where id = $1", [orgId, ids.coord])).toMatch(/informe o motivo/);
    await rows(ids.coord, "update public.organization set stage = 'contacted', updated_by = $2 where id = $1", [orgId, ids.coord]);
    await rows(ids.coord, "update public.organization set stage = 'paused', stage_reason = 'Aguardando orçamento', updated_by = $2 where id = $1", [orgId, ids.coord]);
    const hist = await rows(ids.coord, "select from_value, to_value, actor_id, payload from public.crm_event where organization_id = $1 and kind = 'organization.stage' order by id", [orgId]);
    expect(hist.map((x) => `${x.from_value}>${x.to_value}`)).toEqual(["mapped>contacted", "contacted>paused"]);
    expect(hist[1].actor_id).toBe(ids.coord);
    expect(hist[1].payload.reason).toBe("Aguardando orçamento");
  });

  it("parceiro público exige autorização de marca e é auditado; organização não é apagada", async () => {
    expect(await fails(ids.coord, "update public.organization set public_partner = true, updated_by = $2 where id = $1", [orgId, ids.coord])).toMatch(/organization_public_requires_brand/);
    await rows(ids.coord, "update public.organization set public_partner = true, brand_authorized_at = now(), updated_by = $2 where id = $1", [orgId, ids.coord]);
    const audit = await h.admin.query("select action from public.audit_event where target_type = 'organization' and target_id = $1", [orgId]);
    expect(audit.rows.map((r) => r.action)).toEqual(["organization.public_partner"]);
    await expect(h.admin.query("delete from public.organization where id = $1", [orgId])).rejects.toThrow(/exclusão não permitida/);
  });
});

describe("desafios (13/14/21)", () => {
  let protocol = "";
  let challengeId = "";

  it("envio público: só service role; protocolo DES-AAAA-NNNNNN; auditoria sem detalhes", async () => {
    expect(await fails(null, "select public.submit_research_challenge('A', 'B', 'x@y.z', '', 'Título válido', 'Descrição longa o suficiente para passar.', '{}', false, 'pt', 'h')")).toMatch(/permission denied/);
    expect(await fails(ids.coord, "select public.submit_research_challenge('A', 'B', 'x@y.z', '', 'Título válido', 'Descrição longa o suficiente para passar.', '{}', false, 'pt', 'h')")).toMatch(/permission denied/);
    protocol = await submit("empresa@acme.invalid");
    expect(protocol).toMatch(/^DES-\d{4}-\d{6}$/);
    const audit = await h.admin.query("select actor_id, origin, diff from public.audit_event where action = 'challenge.submitted'");
    expect(audit.rowCount).toBe(1);
    expect(audit.rows[0].actor_id).toBeNull();
    expect(audit.rows[0].origin).toBe("public-form");
    expect(JSON.stringify(audit.rows[0].diff)).not.toMatch(/acme|Pessoa|Desgaste/);
    const c = await h.admin.query("select id, status, consent_at, confidentiality_requested from public.research_challenge where protocol = $1", [protocol]);
    challengeId = c.rows[0].id;
    expect(c.rows[0].status).toBe("received");
    expect(c.rows[0].consent_at).not.toBeNull();
    expect(c.rows[0].confidentiality_requested).toBe(true);
  });

  it("limite de envios: 5 por hora por origem; 3 por dia por e-mail", async () => {
    for (let i = 0; i < 4; i++) await submit(`p${i}@acme.invalid`, "hash-a");
    await expect(submit("p9@acme.invalid", "hash-a")).rejects.toThrow(/limite de envios/);
    await submit("mesmo@acme.invalid", "hash-b");
    await submit("mesmo@acme.invalid", "hash-c");
    await submit("mesmo@acme.invalid", "hash-d");
    await expect(submit("mesmo@acme.invalid", "hash-e")).rejects.toThrow(/limite de envios atingido para este e-mail/);
  });

  it("desafio nunca é lido por anon/membro; orientador só vê quando atribuído", async () => {
    expect(await fails(null, "select id from public.research_challenge")).toMatch(/permission denied/);
    expect(await rows(ids.member, "select id from public.research_challenge")).toHaveLength(0);
    expect(await rows(ids.advisor, "select id from public.research_challenge")).toHaveLength(0);
    await rows(ids.coord, "update public.research_challenge set assigned_to = $2, updated_by = $3 where id = $1", [challengeId, ids.advisor, ids.coord]);
    expect(await rows(ids.advisor, "select id from public.research_challenge")).toHaveLength(1);
    const hist = await rows(ids.coord, "select kind, to_value from public.crm_event where challenge_id = $1 order by id", [challengeId]);
    expect(hist.map((x) => x.kind)).toEqual(["challenge.received", "challenge.assigned"]);
    expect(hist[1].to_value).toBe(ids.advisor);
  });

  it("triagem: cadeia de status no servidor; vínculo com organização registrado; sem exclusão", async () => {
    const set = (who: string, status: string) => fails(who, "update public.research_challenge set status = $2, updated_by = $3 where id = $1", [challengeId, status, who]);
    expect(await set(ids.coord, "accepted")).toMatch(/inválida: received → accepted/);
    expect(await set(ids.coord, "screening")).toBeNull();
    expect(await set(ids.advisor, "forwarded")).toBeNull();
    expect(await set(ids.member, "proposal")).toBeNull(); // 0 linhas (RLS), sem erro
    expect((await h.admin.query("select status from public.research_challenge where id = $1", [challengeId])).rows[0].status).toBe("forwarded");
    await rows(ids.coord, "update public.research_challenge set organization_id = $2, updated_by = $3 where id = $1", [challengeId, orgId, ids.coord]);
    const hist = await rows(ids.coord, "select kind, from_value, to_value from public.crm_event where challenge_id = $1 order by id", [challengeId]);
    expect(hist.map((x) => x.kind)).toEqual(["challenge.received", "challenge.assigned", "challenge.status", "challenge.status", "challenge.linked"]);
    expect(hist[4].to_value).toBe(orgId);
    await expect(h.admin.query("delete from public.research_challenge where id = $1", [challengeId])).rejects.toThrow(/exclusão não permitida/);
  });
});
