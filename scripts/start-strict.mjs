#!/usr/bin/env node
// Serve o build local em modo `strict` (como a produção da Vercel) para conferência visual e
// screenshots do DESIGN-D. Antes: NEXT_DIST_DIR=.next-design NEXT_PUBLIC_CONTENT_MODE=strict npx next build
// Atenção: usa o .env.local (produção) só para LER o conteúdo público; não rode e2e de escrita contra ele.
import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "start", "-p", "3200"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-design" },
});
child.on("exit", (code) => process.exit(code ?? 0));
