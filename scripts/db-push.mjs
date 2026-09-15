// Aplica as migrations no projeto Supabase usando .env.local (senha nunca é impressa).
// Uso: npm run db:push   |   npm run db:types
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const pw = env.SUPABASE_DB_PASSWORD;
if (!pw) {
  console.error("SUPABASE_DB_PASSWORD ausente em .env.local (Supabase → Settings → Database).");
  process.exit(2);
}
const url = (env.SUPABASE_DB_URL ?? "").replace("${SUPABASE_DB_PASSWORD}", encodeURIComponent(pw));
const mode = process.argv[2] ?? "push";
const args = mode === "types"
  ? ["gen", "types", "typescript", "--db-url", url, "--schema", "public"]
  : ["db", "push", "--db-url", url, "--include-all"];
const r = spawnSync("supabase", args, { stdio: mode === "types" ? ["inherit", "pipe", "inherit"] : "inherit", shell: true });
if (mode === "types" && r.status === 0) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync("src/types/database.ts", r.stdout);
  console.log("src/types/database.ts gerado");
}
process.exit(r.status ?? 1);
