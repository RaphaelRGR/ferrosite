// Cria (ou garante) um usuário de teste no Auth do projeto via service role.
// Uso: node scripts/create-test-user.mjs <email> <ENV_PREFIX>   → grava <PREFIX>_EMAIL/<PREFIX>_PASSWORD em .env.local
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const [email, prefix = "E2E_ADMIN"] = process.argv.slice(2);
if (!email) { console.error("uso: node scripts/create-test-user.mjs <email> [PREFIX]"); process.exit(2); }

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const password = env[`${prefix}_PASSWORD`] || randomBytes(18).toString("base64url");

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
const existing = list?.users.find((u) => u.email === email);
if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
  if (error) throw error;
  console.log(`usuário existente atualizado: ${email} (${existing.id})`);
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Usuário de teste" } });
  if (error) throw error;
  console.log(`usuário criado: ${email} (${data.user.id})`);
}

let out = envText;
for (const [k, v] of [[`${prefix}_EMAIL`, email], [`${prefix}_PASSWORD`, password]]) {
  out = out.match(new RegExp(`^${k}=.*$`, "m")) ? out.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : `${out.trimEnd()}\n${k}=${v}\n`;
}
writeFileSync(".env.local", out);
console.log(`${prefix}_EMAIL/${prefix}_PASSWORD gravados em .env.local`);
