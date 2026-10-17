import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./harness";

/**
 * ACC-001: só admin exclui conta, só conta desativada e nunca a própria. Sem histórico, o perfil sai;
 * com histórico, vira "Conta excluída" (sem e-mail) e os registros continuam apontando para ele.
 * O flag da exclusão não serve para ninguém se promover nem para editar a própria conta.
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

beforeAll(async () => {
  h = await startHarness();
  for (const [key, role, status] of [
    ["admin", "admin", "active"],
    ["coord", "coordination", "active"],
    ["member", "member", "active"],
    ["clean", "member", "disabled"],
    ["history", "member", "disabled"],
    ["activeTarget", "member", "active"],
  ] as const) {
    ids[key] = await h.createUser(`${key}@test.invalid`, key);
    await h.admin.query("update public.profile set global_role = $2, status = $3 where id = $1", [ids[key], role, status]);
  }
  // "history" é autor de um conteúdo: o perfil não pode sumir
  await h.admin.query("insert into public.content_item (type, locale, slug, title, summary, author_id, updated_by) values ('news', 'pt', 'nota-historica', 'Nota', 'Resumo', $1, $1)", [ids.history]);
  await h.admin.query(
    "insert into public.mail_outbox (template, recipient_email, recipient_profile_id) values ('content_decided', 'history@test.invalid', $1)",
    [ids.history],
  );
}, 120_000);

afterAll(async () => {
  await h?.stop();
});

describe("exclusão de conta", () => {
  it("só admin exclui; ninguém exclui a própria conta; conta ativa precisa ser desativada antes", async () => {
    expect(await fails(ids.coord, "select public.erase_profile($1)", [ids.clean])).toMatch(/apenas administradores/);
    expect(await fails(ids.member, "select public.erase_profile($1)", [ids.clean])).toMatch(/apenas administradores/);
    expect(await fails(ids.admin, "select public.erase_profile($1)", [ids.admin])).toMatch(/própria conta/);
    expect(await fails(ids.admin, "select public.erase_profile($1)", [ids.activeTarget])).toMatch(/desative a conta/);
  });

  it("conta sem histórico sai por completo e a exclusão fica auditada", async () => {
    const [{ erase_profile }] = await rows(ids.admin, "select public.erase_profile($1)", [ids.clean]);
    expect(erase_profile).toBe("removed");
    expect((await h.admin.query("select 1 from public.profile where id = $1", [ids.clean])).rows).toHaveLength(0);
    const audit = await h.admin.query("select actor_id, diff from public.audit_event where action = 'profile.erased' and target_id = $1", [ids.clean]);
    expect(audit.rows[0].actor_id).toBe(ids.admin);
    expect(audit.rows[0].diff).toEqual({ mode: "removed" });
  });

  it("conta com histórico vira 'Conta excluída', sem e-mail, e os registros continuam íntegros", async () => {
    const [{ erase_profile }] = await rows(ids.admin, "select public.erase_profile($1)", [ids.history]);
    expect(erase_profile).toBe("anonymized");
    const p = (await h.admin.query("select email, full_name, global_role::text, status::text, deleted_at from public.profile where id = $1", [ids.history])).rows[0];
    expect(p).toMatchObject({ email: "", full_name: "Conta excluída", global_role: "viewer", status: "disabled" });
    expect(p.deleted_at).not.toBeNull();
    expect((await h.admin.query("select author_id from public.content_item where slug = 'nota-historica'")).rows[0].author_id).toBe(ids.history);
    // aviso que ainda não tinha saído foi cancelado
    expect((await h.admin.query("select 1 from public.mail_outbox where recipient_profile_id = $1 and status = 'queued'", [ids.history])).rows).toHaveLength(0);
    // repetir é inofensivo
    expect((await rows(ids.admin, "select public.erase_profile($1)", [ids.history]))[0].erase_profile).toBe("anonymized");
  });

  it("conta excluída não volta a ser ativada", async () => {
    expect(await fails(ids.admin, "update public.profile set status = 'active' where id = $1", [ids.history])).toMatch(/conta excluída não pode ser alterada/);
  });

  it("o flag da exclusão não serve para se promover nem para marcar exclusão à mão", async () => {
    const escalate = await fails(ids.member, "select set_config('ferrosite.profile_erasure', 'on', false); update public.profile set global_role = 'admin' where id = auth.uid()");
    expect(escalate).toMatch(/apenas administradores alteram papel/);
    const manual = await fails(ids.admin, "update public.profile set deleted_at = now() where id = $1", [ids.activeTarget]);
    expect(manual).toMatch(/só acontece pela função erase_profile/);
  });
});
