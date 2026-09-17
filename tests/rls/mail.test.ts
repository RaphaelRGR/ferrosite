import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * MAIL-001: a caixa de saída é enfileirada por triggers (desafio recebido,
 * revisão pedida, decisão, publicação, ingresso em equipe), guarda só o mínimo,
 * só admin lê, ninguém autenticado escreve, e reserva/baixa são do service role.
 */
let h: Harness;
const ids: Record<string, string> = {};

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
const outbox = async (where = "true") => (await h.admin.query(`select * from public.mail_outbox where ${where} order by created_at`)).rows;

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role] of [["admin", "admin"], ["coord", "coordination"], ["member", "member"], ["pending", "member"]] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = $3 where id = $1", [ids[key], role, key === "pending" ? "pending" : "active"]);
  }
  await h.admin.query("update public.user_preference set locale = 'en' where profile_id = $1", [ids.coord]);
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("enfileiramento por trigger", () => {
  it("desafio recebido gera confirmação à empresa, no idioma do envio e sem a descrição", async () => {
    await h.asService((c) =>
      c.query("select public.submit_research_challenge($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [
        "Empresa Teste", "Pessoa Teste", "Contato@Empresa.invalid", "", "Desgaste prematuro de rodas", "Descrição confidencial longa o suficiente do problema técnico.", ["materiais"], true, "en", "hash-1",
      ]),
    );
    const mails = await outbox("template = 'challenge_received'");
    expect(mails).toHaveLength(1);
    expect(mails[0].recipient_email).toBe("contato@empresa.invalid");
    expect(mails[0].locale).toBe("en");
    expect(mails[0].payload.protocol).toMatch(/^DES-\d{4}-\d{6}$/);
    expect(JSON.stringify(mails[0].payload)).not.toMatch(/confidencial/);
    expect(mails[0].status).toBe("queued");
  });

  it("revisão avisa aprovadores ativos (não o autor); decisão e publicação avisam o autor no idioma da preferência", async () => {
    const item = (await rows(ids.coord, "insert into public.content_item (type, locale, slug, title, author_id, updated_by) values ('news', 'pt', 'nota-um', 'Nota um', $1, $1) returning id, version", [ids.coord]))[0];
    await rows(ids.coord, "update public.content_item set status = 'review', updated_by = $2 where id = $1", [item.id, ids.coord]);
    const review = await outbox("template = 'content_review_requested'");
    expect(review.map((m) => m.recipient_profile_id).sort()).toEqual([ids.admin].sort()); // coord é autor; member não aprova
    expect(review[0].payload.title).toBe("Nota um");

    await rows(ids.admin, "update public.content_item set status = 'approved', updated_by = $2 where id = $1", [item.id, ids.admin]);
    const decided = await outbox("template = 'content_decided'");
    expect(decided).toHaveLength(1);
    expect(decided[0].recipient_profile_id).toBe(ids.coord);
    expect(decided[0].locale).toBe("en");
    expect(decided[0].payload.decision).toBe("approved");

    await rows(ids.admin, "select public.publish_content($1)", [item.id]);
    const published = await outbox("template = 'content_published'");
    expect(published).toHaveLength(1);
    expect(published[0].recipient_profile_id).toBe(ids.coord);
    expect(published[0].payload.slug).toBe("nota-um");
  });

  it("ingresso em equipe avisa quem entrou; perfil pendente não recebe; mudança sem efeito não repete", async () => {
    const project = (await rows(ids.coord, "insert into public.project (name, slug, created_by, updated_by) values ('Projeto Mail', 'projeto-mail', $1, $1) returning id", [ids.coord]))[0];
    await rows(ids.coord, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'member', $3)", [project.id, ids.member, ids.coord]);
    await rows(ids.coord, "insert into public.project_membership (project_id, profile_id, role, granted_by) values ($1, $2, 'member', $3)", [project.id, ids.pending, ids.coord]);
    let mails = await outbox("template = 'membership_granted'");
    expect(mails).toHaveLength(1);
    expect(mails[0].recipient_profile_id).toBe(ids.member);
    expect(mails[0].payload.projectSlug).toBe("projeto-mail");

    await rows(ids.coord, "update public.project_membership set updated_at = now() where project_id = $1 and profile_id = $2", [project.id, ids.member]);
    mails = await outbox("template = 'membership_granted'");
    expect(mails).toHaveLength(1);
    await rows(ids.coord, "update public.project_membership set role = 'leader' where project_id = $1 and profile_id = $2", [project.id, ids.member]);
    mails = await outbox("template = 'membership_granted'");
    expect(mails).toHaveLength(2);
    expect(mails[1].payload.role).toBe("leader");
  });
});

describe("acesso e entrega", () => {
  it("só admin lê a fila; ninguém autenticado insere/edita; anon não vê", async () => {
    expect((await rows(ids.admin, "select id from public.mail_outbox")).length).toBeGreaterThan(0);
    expect(await rows(ids.coord, "select id from public.mail_outbox")).toHaveLength(0);
    expect(await fails(ids.admin, "insert into public.mail_outbox (template, recipient_email) values ('challenge_received', 'x@y.invalid')")).toMatch(/row-level security/);
    expect(await fails(ids.admin, "update public.mail_outbox set status = 'sent'")).toBeNull(); // sem policy de update: 0 linhas
    expect((await h.admin.query("select count(*)::int as n from public.mail_outbox where status = 'sent'")).rows[0].n).toBe(0);
    expect(await fails(null, "select id from public.mail_outbox")).toMatch(/permission denied/);
    expect(await fails(ids.admin, "select public.enqueue_mail('challenge_received', 'pt', 'x@y.invalid', null, '', '', '{}')")).toMatch(/permission denied/);
    expect(await fails(ids.admin, "select * from public.claim_mail_outbox(5)")).toMatch(/permission denied/);
  });

  it("resumo só para admin; reserva marca tentativa e não repete dentro de 10 min; baixa fecha ou re-enfileira", async () => {
    const summary = await rows(ids.admin, "select * from public.mail_outbox_summary()");
    expect(Number(summary.find((s) => s.status === "queued")?.total)).toBeGreaterThan(0);
    expect(await rows(ids.coord, "select * from public.mail_outbox_summary()")).toHaveLength(0);

    const total = (await outbox("status = 'queued'")).length;
    const batch = await h.asService(async (c) => (await c.query("select * from public.claim_mail_outbox(2)")).rows);
    expect(batch).toHaveLength(2);
    expect(batch[0].attempts).toBe(1);
    const again = await h.asService(async (c) => (await c.query("select * from public.claim_mail_outbox(100)")).rows);
    expect(again).toHaveLength(total - 2);

    await h.asService((c) => c.query("select public.settle_mail_outbox($1, true, 'msg-1')", [batch[0].id]));
    await h.asService((c) => c.query("select public.settle_mail_outbox($1, false, 'timeout')", [batch[1].id]));
    const [sent] = await outbox(`id = '${batch[0].id}'`);
    const [retry] = await outbox(`id = '${batch[1].id}'`);
    expect(sent.status).toBe("sent");
    expect(sent.provider_message_id).toBe("msg-1");
    expect(retry.status).toBe("queued");
    expect(retry.last_error).toBe("timeout");
    expect(retry.claimed_at).toBeNull();

    await h.admin.query("update public.mail_outbox set attempts = 5 where id = $1", [batch[1].id]);
    await h.asService((c) => c.query("select public.settle_mail_outbox($1, false, 'again')", [batch[1].id]));
    expect((await outbox(`id = '${batch[1].id}'`))[0].status).toBe("failed");
    expect(await h.asService(async (c) => (await c.query("select * from public.claim_mail_outbox(100)")).rows)).toHaveLength(0);
  });
});
