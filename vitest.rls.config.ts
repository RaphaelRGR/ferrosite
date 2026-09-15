import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Testes de RLS em Postgres embutido (sem nuvem): aplica as migrations reais.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/rls/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 180_000,
    fileParallelism: false,
  },
});
