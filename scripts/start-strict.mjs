#!/usr/bin/env node
// Serve um build local do site para conferência visual e e2e de LEITURA do DESIGN-D.
//   strict (como a produção):  NEXT_DIST_DIR=.next-design NEXT_PUBLIC_CONTENT_MODE=strict npx next build
//                               node scripts/start-strict.mjs                      (porta 3200)
//   review (modo dos e2e):     NEXT_DIST_DIR=.next-design-review NEXT_PUBLIC_CONTENT_MODE=review npx next build
//                               node scripts/start-strict.mjs .next-design-review 3300
// Atenção: usa o .env.local (produção) só para LER o conteúdo público; nunca rode e2e de escrita contra ele.
import { spawn } from "node:child_process";

const [dir = ".next-design", port = "3200"] = process.argv.slice(2);
const child = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: dir },
});
child.on("exit", (code) => process.exit(code ?? 0));
