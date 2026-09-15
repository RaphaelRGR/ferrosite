// Gera src/types/database.ts a partir das migrations reais em um Postgres embutido,
// sem nuvem nem Docker (`supabase gen types` exige a imagem postgres-meta via Docker).
// Lê information_schema/pg_catalog e emite o mesmo formato `Database` que o
// supabase-js consome (Tables Row/Insert/Update, Enums, Functions).
// Uso: npm run db:types:local
import EmbeddedPostgres from "embedded-postgres";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";

const dataDir = mkdtempSync(path.join(tmpdir(), "ferrosite-types-"));
const port = 54490 + Math.floor(Math.random() * 100);
const cluster = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: false,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => undefined,
  onError: () => undefined,
});
const shim = readFileSync("tests/rls/harness.ts", "utf8").match(/const AUTH_SHIM = `([\s\S]*?)`;/)[1];

const SCALARS = {
  uuid: "string", text: "string", varchar: "string", timestamptz: "string", timestamp: "string", date: "string",
  int4: "number", int8: "number", integer: "number", bigint: "number", numeric: "number", float8: "number",
  bool: "boolean", boolean: "boolean", jsonb: "Json", json: "Json", void: "undefined",
};

function tsType(udt, enums) {
  if (udt.startsWith("_")) return `${tsType(udt.slice(1), enums)}[]`;
  if (enums.has(udt)) return `Database["public"]["Enums"]["${udt}"]`;
  return SCALARS[udt] ?? "unknown";
}

async function main() {
  await cluster.initialise();
  await cluster.start();
  await cluster.createDatabase("ferrosite");
  const c = new pg.Client({ host: "127.0.0.1", port, user: "postgres", password: "postgres", database: "ferrosite" });
  await c.connect();
  await c.query(shim);
  const dir = path.resolve("supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await c.query(readFileSync(path.join(dir, file), "utf8"));
  }

  const enumsRows = (await c.query(`
    select t.typname, array_agg(e.enumlabel::text order by e.enumsortorder) as labels
    from pg_type t join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' group by t.typname order by t.typname`)).rows;
  const enums = new Map(enumsRows.map((r) => [r.typname, r.labels]));

  const cols = (await c.query(`
    select c.table_name, c.column_name, c.udt_name, c.is_nullable = 'YES' as nullable,
           c.column_default is not null as has_default, c.is_identity = 'YES' or c.is_generated = 'ALWAYS' as generated
    from information_schema.columns c
    join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position`)).rows;
  const tables = new Map();
  for (const col of cols) {
    if (!tables.has(col.table_name)) tables.set(col.table_name, []);
    tables.get(col.table_name).push(col);
  }

  const viewCols = (await c.query(`
    select c.table_name, c.column_name, c.udt_name, c.is_nullable = 'YES' as nullable
    from information_schema.columns c
    join information_schema.views v on v.table_name = c.table_name and v.table_schema = c.table_schema
    where c.table_schema = 'public' order by c.table_name, c.ordinal_position`)).rows;
  const views = new Map();
  for (const col of viewCols) {
    if (!views.has(col.table_name)) views.set(col.table_name, []);
    views.get(col.table_name).push(col);
  }

  const fns = (await c.query(`
    select p.proname, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as result, p.proretset
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('service_role', p.oid, 'execute'))
      and p.prorettype <> 'trigger'::regtype
      -- só funções das migrations (não de extensões como pgcrypto)
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
    order by p.proname`)).rows;
  await c.end();

  const sqlType = (t) => {
    const base = t.replace(/^public\./, "").replace(/\[\]$/, "");
    const map = { "timestamp with time zone": "timestamptz", "character varying": "varchar", "double precision": "float8" };
    const udt = map[base] ?? base;
    return t.endsWith("[]") ? `${tsType(udt, enums)}[]` : tsType(udt, enums);
  };
  const parseArgs = (args) =>
    args
      ? args.split(",").map((a) => {
          const m = a.trim().match(/^(?:VARIADIC\s+)?(\w+)\s+(.+?)(?:\s+DEFAULT\s+.+)?$/i);
          if (!m) throw new Error(`argumento não reconhecido: "${a}" em "${args}"`);
          return { name: m[1], type: sqlType(m[2]), optional: /DEFAULT/i.test(a) };
        })
      : [];
  const parseResult = (result, proretset) => {
    if (result.startsWith("TABLE(")) {
      const fields = result.slice(6, -1).split(",").map((f) => f.trim().split(/\s+/));
      return `{ ${fields.map(([n, ...t]) => `${n}: ${sqlType(t.join(" "))}`).join("; ")} }[]`;
    }
    const t = sqlType(result.replace(/^SETOF\s+/, ""));
    return proretset ? `${t}[]` : t;
  };

  let out = "// Gerado por scripts/db-types-local.mjs a partir de supabase/migrations (não editar à mão).\n";
  out += "export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n\n";
  out += "export type Database = {\n  public: {\n    Tables: {\n";
  for (const [name, list] of tables) {
    const row = list.map((col) => `${col.column_name}: ${tsType(col.udt_name, enums)}${col.nullable ? " | null" : ""}`);
    const insert = list.filter((col) => !col.generated).map((col) => `${col.column_name}${col.nullable || col.has_default ? "?" : ""}: ${tsType(col.udt_name, enums)}${col.nullable ? " | null" : ""}`);
    const update = list.filter((col) => !col.generated).map((col) => `${col.column_name}?: ${tsType(col.udt_name, enums)}${col.nullable ? " | null" : ""}`);
    out += `      ${name}: {\n        Row: { ${row.join("; ")} };\n        Insert: { ${insert.join("; ")} };\n        Update: { ${update.join("; ")} };\n        Relationships: [];\n      };\n`;
  }
  out += "    };\n    Views: {\n";
  for (const [name, list] of views) {
    const row = list.map((col) => `${col.column_name}: ${tsType(col.udt_name, enums)}${col.nullable ? " | null" : ""}`);
    out += `      ${name}: {\n        Row: { ${row.join("; ")} };\n        Relationships: [];\n      };\n`;
  }
  out += "    };\n    Functions: {\n";
  for (const fn of fns) {
    const args = parseArgs(fn.args);
    out += `      ${fn.proname}: {\n        Args: { ${args.map((a) => `${a.name}${a.optional ? "?" : ""}: ${a.type}`).join("; ")} };\n        Returns: ${parseResult(fn.result, fn.proretset)};\n      };\n`;
  }
  out += "    };\n    Enums: {\n";
  for (const [name, labels] of enums) out += `      ${name}: ${labels.map((l) => JSON.stringify(l)).join(" | ")};\n`;
  out += "    };\n    CompositeTypes: Record<string, never>;\n  };\n};\n\n";
  out += 'export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];\n';
  out += 'export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];\n';
  writeFileSync("src/types/database.ts", out);
  console.log(`src/types/database.ts gerado: ${tables.size} tabelas, ${views.size} views, ${enums.size} enums, ${fns.length} funções`);
}

try {
  await main();
} finally {
  await cluster.stop().catch(() => undefined);
  rmSync(dataDir, { recursive: true, force: true });
}
