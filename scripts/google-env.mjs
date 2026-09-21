// Copia Client ID/secret do JSON baixado do Google Cloud (secrets/client_secret*.json)
// para .env.local (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).
// Uso: npm run google:env [caminho-do-json]. Nada é impresso além dos nomes das variáveis.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const arg = process.argv[2];
const dir = "secrets";
const file = arg ?? (existsSync(dir) ? readdirSync(dir).filter((f) => /^client_secret.*\.json$/.test(f)).map((f) => path.join(dir, f))[0] : undefined);
if (!file || !existsSync(file)) {
  console.error("JSON do cliente OAuth não encontrado (secrets/client_secret*.json). Baixe em Google Cloud → APIs e serviços → Credenciais.");
  process.exit(2);
}
const json = JSON.parse(readFileSync(file, "utf8"));
const web = json.web ?? json.installed;
if (!web?.client_id || !web?.client_secret) {
  console.error("JSON sem client_id/client_secret (esperado um cliente do tipo 'Aplicativo da Web').");
  process.exit(2);
}
const redirect = (web.redirect_uris ?? []).find((u) => /\/api\/auth\/google\/callback$/.test(u)) ?? "http://localhost:3000/api/auth/google/callback";

const envPath = ".env.local";
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const nl = env.includes("\r\n") ? "\r\n" : "\n";
const set = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(env)) env = env.replace(re, `${key}=${value}`);
  else env = `${env.replace(/\s*$/, "")}${nl}${key}=${value}${nl}`;
};
set("GOOGLE_CLIENT_ID", web.client_id);
set("GOOGLE_CLIENT_SECRET", web.client_secret);
set("GOOGLE_REDIRECT_URI", redirect);
if (!/^GOOGLE_DRIVE_ROOT_FOLDER_ID=/m.test(env)) set("GOOGLE_DRIVE_ROOT_FOLDER_ID", "");
writeFileSync(envPath, env);
console.log(`Gravado em ${envPath}: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI (${redirect}). Reinicie o servidor de desenvolvimento.`);
