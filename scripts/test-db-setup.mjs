// Prepara o projeto Supabase de TESTES (TEST-001) a partir do .env.test.local. Idempotente.
// 1. aplica as migrations;
// 2. cria/garante as 3 contas de teste (admin, coordenação, membro) e grava as senhas no .env.test.local;
// 3. copia da produção só o conteúdo PÚBLICO (projetos públicos e publicações no ar), sem pessoas,
//    contatos, notas internas nem arquivos (autoria vira a conta admin de teste; fotos ficam sem arquivo).
// Uso: npm run test:db:setup   (nenhum segredo é impresso)
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { dbUrl, PROD_ENV_FILE, readEnvFile, requireTestEnv, TEST_ENV_FILE, upsertEnvFile } from "./lib/env-file.mjs";

const pg = createRequire(import.meta.url)("pg");
let env;
try {
  env = requireTestEnv();
} catch (e) {
  console.error(`${e.message}\nVeja docs/TESTING.md (projeto Supabase de testes).`);
  process.exit(2);
}
const prod = readEnvFile(PROD_ENV_FILE);

console.log("1/3 migrations no projeto de testes");
const push = spawnSync(process.execPath, ["scripts/db-push.mjs", "push", "--test"], { stdio: "inherit" });
if (push.status !== 0) process.exit(push.status ?? 1);

console.log("2/3 contas de teste");
const ACCOUNTS = [
  { prefix: "E2E_ADMIN", email: "e2e-admin@ferrosite.test", name: "Administração de teste", role: "admin" },
  { prefix: "E2E_REVIEWER", email: "e2e-reviewer@ferrosite.test", name: "Coordenação de teste", role: "coordination" },
  { prefix: "E2E_MEMBER", email: "e2e-member@ferrosite.test", name: "Membro de teste", role: "member" },
];
const auth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: list, error: listError } = await auth.auth.admin.listUsers({ perPage: 200 });
if (listError) throw new Error(`Auth do projeto de testes: ${listError.message}`);
const ids = {};
const creds = {};
for (const a of ACCOUNTS) {
  const password = env[`${a.prefix}_PASSWORD`] || randomBytes(18).toString("base64url");
  const existing = list.users.find((u) => u.email === a.email);
  const res = existing
    ? await auth.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    : await auth.auth.admin.createUser({ email: a.email, password, email_confirm: true, user_metadata: { full_name: a.name } });
  if (res.error) throw new Error(`${a.email}: ${res.error.message}`);
  ids[a.role] = res.data.user.id;
  creds[`${a.prefix}_EMAIL`] = a.email;
  creds[`${a.prefix}_PASSWORD`] = password;
  console.log(`   ${existing ? "atualizada" : "criada"}: ${a.email} (${a.role})`);
}
upsertEnvFile(TEST_ENV_FILE, creds);

const test = new pg.Client({ connectionString: dbUrl(env), ssl: { rejectUnauthorized: false } });
await test.connect();
for (const a of ACCOUNTS) {
  await test.query("update public.profile set global_role = $2, status = 'active', full_name = $3 where id = $1", [ids[a.role], a.role, a.name]);
}

console.log("3/3 conteúdo público copiado da produção");
if (!prod?.SUPABASE_DB_URL) {
  console.log("   .env.local sem SUPABASE_DB_URL: pulando a cópia (os testes de conteúdo serão pulados)");
} else {
  const src = new pg.Client({ connectionString: dbUrl(prod), ssl: { rejectUnauthorized: false } });
  await src.connect();
  await src.query("begin transaction read only");
  const rows = async (sql) => (await src.query(sql)).rows.map((r) => r.row);
  const projects = await rows(`select to_jsonb(p) as row from public.project p
    where p.classification = 'public' and p.status::text in ('planned', 'active', 'paused', 'completed')`);
  const pubs = await rows("select to_jsonb(p) as row from public.publication p where p.unpublished_at is null");
  const items = await rows(`select to_jsonb(i) as row from public.content_item i
    where i.id in (select item_id from public.publication where unpublished_at is null)`);
  const revisions = await rows(`select to_jsonb(r) as row from public.content_revision r
    where r.id in (select revision_id from public.publication where unpublished_at is null)`);
  await src.query("rollback");
  await src.end();

  const admin = ids.admin;
  const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
  const projectIds = new Set(projects.map((p) => p.id));
  const clean = {
    project: (p) => ({ ...p, created_by: admin, updated_by: admin, deliverables: "" }),
    content_item: (i) => {
      const rest = omit(i, ["preview_token"]); // token de prévia novo (default da coluna)
      return { ...rest, author_id: admin, updated_by: admin, cover_file_id: null, organization_id: null, source_note: "", project_id: projectIds.has(i.project_id) ? i.project_id : null };
    },
    content_revision: (r) => ({ ...r, author_id: admin, snapshot: omit(r.snapshot ?? {}, ["source_note", "cover_file_id", "organization_id"]) }),
    publication: (p) => ({ ...p, published_by: admin, cover_file_id: null, gallery_file_ids: [] }),
  };

  await test.query("begin");
  // carga de dados já consistentes: sem triggers de fluxo/auditoria (são regras de uso, não de importação)
  await test.query("set local session_replication_role = replica");
  const load = async (table, list) => {
    let n = 0;
    for (const r of list) n += (await test.query(`insert into public.${table} select * from jsonb_populate_record(null::public.${table}, $1) on conflict do nothing`, [JSON.stringify(clean[table](r))])).rowCount;
    console.log(`   ${table}: ${n} novos de ${list.length}`);
  };
  await load("project", projects);
  await load("content_item", items);
  await load("content_revision", revisions);
  await load("publication", pubs);
  await test.query("commit");
}
await test.end();
console.log(`pronto: ${TEST_ENV_FILE} tem as contas de teste; rode npm run test:e2e`);
