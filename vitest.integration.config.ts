import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { loadEnv } from "vite";

function testEnv(): Record<string, string> {
  // sem o projeto de testes, nada de Supabase: os testes pulam em vez de criar usuários na produção
  if (!existsSync(".env.test.local")) return {};
  return loadEnv("test", process.cwd(), "");
}

// Testes de integração contra o Supabase de TESTES (.env.test.local, TEST-001); pulam sem env.
// loadEnv("test") lê .env.test.local por cima do .env.local: as chaves do Supabase vêm do projeto de testes.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    env: testEnv(),
    testTimeout: 60_000,
    hookTimeout: 90_000,
    fileParallelism: false,
  },
});
