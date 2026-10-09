// Leitura de arquivos .env sem dependências (os scripts rodam fora do Next).
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const PROD_ENV_FILE = ".env.local";
export const TEST_ENV_FILE = ".env.test.local";

export function readEnvFile(path) {
  if (!existsSync(path)) return null;
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"(.*)"$/, "$1")]),
  );
}

/** Grava/atualiza chaves num arquivo .env preservando o resto (valores nunca são impressos). */
export function upsertEnvFile(path, pairs) {
  let out = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [k, v] of Object.entries(pairs)) {
    const re = new RegExp(`^${k}=.*$`, "m");
    out = re.test(out) ? out.replace(re, `${k}=${v}`) : `${out.trimEnd()}\n${k}=${v}\n`;
  }
  writeFileSync(path, out);
}

/** URL do Postgres com a senha substituída (o arquivo guarda `${SUPABASE_DB_PASSWORD}`). */
export function dbUrl(env) {
  return (env.SUPABASE_DB_URL ?? "").replace("${SUPABASE_DB_PASSWORD}", encodeURIComponent(env.SUPABASE_DB_PASSWORD ?? ""));
}

/** Ref do projeto a partir da URL pública (https://<ref>.supabase.co). */
export function refOf(env) {
  return env?.SUPABASE_PROJECT_REF || /^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(env?.NEXT_PUBLIC_SUPABASE_URL ?? "")?.[1] || "";
}

/**
 * Ambiente de testes (TEST-001): `.env.test.local` aponta para um projeto Supabase só de testes.
 * Recusa seguir se ele estiver ausente, incompleto ou apontar para o mesmo projeto da produção.
 */
export function requireTestEnv() {
  const test = readEnvFile(TEST_ENV_FILE);
  if (!test) throw new Error(`${TEST_ENV_FILE} não existe: copie .env.test.example e preencha com o projeto Supabase de testes.`);
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_PASSWORD", "SUPABASE_DB_URL"].filter((k) => !test[k]);
  if (missing.length) throw new Error(`${TEST_ENV_FILE} incompleto: falta ${missing.join(", ")}.`);
  const prodRef = refOf(readEnvFile(PROD_ENV_FILE));
  const testRef = refOf(test);
  if (!testRef) throw new Error(`${TEST_ENV_FILE}: NEXT_PUBLIC_SUPABASE_URL não parece um projeto Supabase.`);
  if (prodRef && (testRef === prodRef || (test.SUPABASE_DB_URL ?? "").includes(prodRef))) throw new Error(`${TEST_ENV_FILE} aponta para o projeto de PRODUÇÃO (${prodRef}). Use um projeto separado.`);
  return test;
}
