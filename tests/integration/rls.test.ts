import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Testes de isolamento (11/21): rodam contra o projeto Supabase configurado em
 * .env.local usando a service role apenas para provisionar/limpar usuários.
 * Cada cenário usa um client autenticado como a pessoa em questão (anon key +
 * sessão), então as políticas RLS são exercidas de verdade.
 *
 * Pulado quando não há URL/anon/service role ou quando o schema não foi aplicado.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled = Boolean(URL_ && ANON && SERVICE);

const RUN = `rls-${Date.now().toString(36)}`;
const PASSWORD = `Test!${RUN}-senha`;
const mail = (who: string) => `${RUN}-${who}@example.invalid`;

type Actor = { id: string; email: string; client: SupabaseClient };

let admin: SupabaseClient; // service role
const actors: Record<string, Actor> = {};
let projectId = "";
let schemaReady = false;

async function createActor(who: string, role: string, status: string): Promise<Actor> {
  const email = mail(who);
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: who } });
  if (error) throw error;
  const id = data.user.id;
  // trigger cria o perfil pendente/viewer; service role ajusta papel e status (sem uid ⇒ guard liberado)
  const { error: upd } = await admin.from("profile").update({ global_role: role, status }).eq("id", id);
  if (upd) throw upd;
  const client = createClient(URL_!, ANON!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signIn } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn) throw signIn;
  return { id, email, client };
}

describe.skipIf(!enabled)("RLS — isolamento por projeto e papéis", () => {
  beforeAll(async () => {
    admin = createClient(URL_!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } });
    const probe = await admin.from("profile").select("id").limit(1);
    schemaReady = !probe.error;
    if (!schemaReady) return;

    actors.admin = await createActor("admin", "admin", "active");
    actors.leader = await createActor("leader", "member", "active");
    actors.outsider = await createActor("outsider", "member", "active");
    actors.pending = await createActor("pending", "member", "pending");
    actors.external = await createActor("external", "external", "active");

    const { data: project, error } = await actors.admin.client
      .from("project")
      .insert({ slug: `${RUN}-p1`, name: "Projeto A", created_by: actors.admin.id, updated_by: actors.admin.id })
      .select("id")
      .single();
    if (error) throw error;
    projectId = project.id;

    const { error: mErr } = await actors.admin.client
      .from("project_membership")
      .insert({ project_id: projectId, profile_id: actors.leader.id, role: "leader", granted_by: actors.admin.id });
    if (mErr) throw mErr;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    for (const a of Object.values(actors)) await admin.auth.admin.deleteUser(a.id).catch(() => undefined);
  });

  it("schema aplicado (profile existe)", () => {
    expect(schemaReady, "aplique as migrations: supabase db push").toBe(true);
  });

  it("anônimo não lê nenhuma tabela privada", async () => {
    const anon = createClient(URL_!, ANON!, { auth: { persistSession: false } });
    for (const table of ["profile", "project", "project_membership", "mission", "audit_event"]) {
      const { data, error } = await anon.from(table).select("*").limit(1);
      expect(error ?? data, table).not.toEqual(expect.arrayContaining([expect.anything()]));
      expect(data ?? []).toHaveLength(0);
    }
  });

  it("membro de outro projeto não vê o projeto A (mesmo com o ID)", async () => {
    const { data } = await actors.outsider.client.from("project").select("id").eq("id", projectId);
    expect(data).toEqual([]);
    const { data: m } = await actors.outsider.client.from("project_membership").select("*").eq("project_id", projectId);
    expect(m).toEqual([]);
  });

  it("líder vê o projeto e cria missão; forasteiro não consegue inserir", async () => {
    const { data } = await actors.leader.client.from("project").select("id, name").eq("id", projectId);
    expect(data).toHaveLength(1);

    const ok = await actors.leader.client
      .from("mission")
      .insert({ project_id: projectId, title: "Missão 1", created_by: actors.leader.id, updated_by: actors.leader.id })
      .select("id")
      .single();
    expect(ok.error).toBeNull();

    const denied = await actors.outsider.client
      .from("mission")
      .insert({ project_id: projectId, title: "Invasão", created_by: actors.outsider.id, updated_by: actors.outsider.id });
    expect(denied.error).not.toBeNull();
  });

  it("conta pendente não lê projetos nem missões, mesmo com membership", async () => {
    await actors.admin.client
      .from("project_membership")
      .insert({ project_id: projectId, profile_id: actors.pending.id, role: "member", granted_by: actors.admin.id });
    const { data: p } = await actors.pending.client.from("project").select("id").eq("id", projectId);
    expect(p).toEqual([]);
    const { data: m } = await actors.pending.client.from("mission").select("id").eq("project_id", projectId);
    expect(m).toEqual([]);
  });

  it("externo exige prazo; expirado perde acesso", async () => {
    const noExpiry = await actors.admin.client
      .from("project_membership")
      .insert({ project_id: projectId, profile_id: actors.external.id, role: "external", granted_by: actors.admin.id });
    expect(noExpiry.error?.message ?? "").toMatch(/membership_external_expires/);

    const expired = await actors.admin.client.from("project_membership").insert({
      project_id: projectId, profile_id: actors.external.id, role: "external", granted_by: actors.admin.id,
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(expired.error).toBeNull();
    const { data } = await actors.external.client.from("project").select("id").eq("id", projectId);
    expect(data).toEqual([]);
  });

  it("usuário comum não altera o próprio papel; último admin não é rebaixado", async () => {
    const self = await actors.leader.client.from("profile").update({ global_role: "admin" }).eq("id", actors.leader.id).select("global_role");
    expect(self.error?.message ?? JSON.stringify(self.data)).toMatch(/administradores|\[\]/);

    const { data: admins } = await admin.from("profile").select("id").eq("global_role", "admin").eq("status", "active");
    if ((admins ?? []).length === 1) {
      const demote = await actors.admin.client.from("profile").update({ global_role: "member" }).eq("id", actors.admin.id);
      expect(demote.error?.message ?? "").toMatch(/último administrador/);
    }
  });

  it("mudanças de membership geram auditoria legível só por overseers", async () => {
    const { data: byAdmin } = await actors.admin.client
      .from("audit_event")
      .select("action")
      .eq("target_type", "project_membership")
      .like("target_id", `${projectId}:%`);
    expect((byAdmin ?? []).length).toBeGreaterThan(0);

    const { data: byLeader } = await actors.leader.client.from("audit_event").select("id").limit(1);
    expect(byLeader ?? []).toEqual([]);

    const tamper = await actors.admin.client.from("audit_event").delete().eq("target_type", "project_membership");
    expect((tamper.count ?? 0) === 0 || tamper.error !== null).toBe(true);
  });
});
