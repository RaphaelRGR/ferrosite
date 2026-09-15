import EmbeddedPostgres from "embedded-postgres";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "pg";

/**
 * Postgres embutido + shim mínimo do schema `auth` do Supabase, para aplicar as
 * migrations reais e exercitar as políticas RLS localmente/CI sem nuvem.
 * O shim reproduz o que as políticas usam: auth.users, auth.uid(), auth.role(),
 * auth.jwt() e os papéis anon/authenticated/service_role com os grants padrão.
 */
const AUTH_SHIM = `
create schema if not exists auth;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'role', '')
$$;
-- Como no Supabase: as funções auth.* são chamáveis por todos; auth.users não é legível.
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.jwt(), auth.uid(), auth.role() to anon, authenticated, service_role;
`;

export interface Harness {
  admin: Client;
  /** Executa `fn` como usuário autenticado (RLS aplicada), em transação própria. */
  as<T>(userId: string | null, fn: (client: Client) => Promise<T>): Promise<T>;
  /** Executa como service role (bypass de RLS, sem auth.uid()), como a Server Action do site. */
  asService<T>(fn: (client: Client) => Promise<T>): Promise<T>;
  createUser(email: string, fullName?: string): Promise<string>;
  stop(): Promise<void>;
}

export async function startHarness(): Promise<Harness> {
  const dataDir = mkdtempSync(path.join(tmpdir(), "ferrosite-pg-"));
  const port = 54390 + Math.floor(Math.random() * 100);
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: false,
    // Cluster em UTF-8 e locale C, como no Supabase; sem isto o Windows cria WIN1252.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => undefined,
    onError: () => undefined,
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("ferrosite");

  const admin = new Client({ host: "127.0.0.1", port, user: "postgres", password: "postgres", database: "ferrosite" });
  await admin.connect();
  await admin.query(AUTH_SHIM);

  const dir = path.resolve(process.cwd(), "supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await admin.query(readFileSync(path.join(dir, file), "utf8"));
  }

  const connect = async () => {
    const c = new Client({ host: "127.0.0.1", port, user: "postgres", password: "postgres", database: "ferrosite" });
    await c.connect();
    return c;
  };

  return {
    admin,
    async as(userId, fn) {
      const c = await connect();
      try {
        await c.query("begin");
        if (userId) {
          await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
          await c.query("set local role authenticated");
        } else {
          await c.query("select set_config('request.jwt.claims', '{\"role\":\"anon\"}', true)");
          await c.query("set local role anon");
        }
        const result = await fn(c);
        await c.query("commit");
        return result;
      } catch (e) {
        await c.query("rollback").catch(() => undefined);
        throw e;
      } finally {
        await c.end();
      }
    },
    async asService(fn) {
      const c = await connect();
      try {
        await c.query("begin");
        await c.query("select set_config('request.jwt.claims', '{\"role\":\"service_role\"}', true)");
        await c.query("set local role service_role");
        const result = await fn(c);
        await c.query("commit");
        return result;
      } catch (e) {
        await c.query("rollback").catch(() => undefined);
        throw e;
      } finally {
        await c.end();
      }
    },
    async createUser(email, fullName = "") {
      const { rows } = await admin.query(
        "insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), $1, $2) returning id",
        [email, JSON.stringify({ full_name: fullName })],
      );
      return rows[0].id as string;
    },
    async stop() {
      await admin.end().catch(() => undefined);
      await pg.stop().catch(() => undefined);
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
