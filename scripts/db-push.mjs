// Aplica as migrations no projeto Supabase usando .env.local (senha nunca é impressa).
// Uso: npm run db:push   |   npm run db:types   |   npm run db:push:test (projeto de testes, .env.test.local)
import { spawnSync } from "node:child_process";
import { dbUrl, PROD_ENV_FILE, readEnvFile, requireTestEnv } from "./lib/env-file.mjs";

const mode = process.argv[2] ?? "push";
const test = process.argv.includes("--test");
let env;
try {
  env = test ? requireTestEnv() : readEnvFile(PROD_ENV_FILE) ?? {};
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
if (!env.SUPABASE_DB_PASSWORD) {
  console.error(`SUPABASE_DB_PASSWORD ausente em ${test ? ".env.test.local" : PROD_ENV_FILE} (Supabase → Settings → Database).`);
  process.exit(2);
}
const url = dbUrl(env);
const args = mode === "types"
  ? ["gen", "types", "typescript", "--db-url", url, "--schema", "public"]
  : ["db", "push", "--db-url", url, "--include-all", ...(test ? ["--yes"] : [])];
const r = spawnSync("supabase", args, { stdio: mode === "types" ? ["inherit", "pipe", "inherit"] : "inherit", shell: true });
if (mode === "types" && r.status === 0) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync("src/types/database.ts", r.stdout);
  console.log("src/types/database.ts gerado");
}
process.exit(r.status ?? 1);
