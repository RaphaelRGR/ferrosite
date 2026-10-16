import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// DESIGN-D: fonte e tokens do site público não podem vazar para o Portal (que usa o mesmo HtmlShell).
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

/** Separa uma lista de seletores só nas vírgulas de nível superior (não dentro de `:is(...)`). */
function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of list) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  return [...out, cur];
}

describe("escopo do tema público (DESIGN-D)", () => {
  it("toda regra de public-theme.css fica sob [data-site=\"public\"]", () => {
    const css = read("src/components/layout/public-theme.css").replace(/\/\*[\s\S]*?\*\//g, "");
    // seletores = texto antes de cada "{" que não é um @layer/@media
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(5);
    for (const s of selectors) {
      for (const part of splitSelectors(s)) expect(part.trim(), s).toMatch(/^\[data-site="public"\]/);
    }
  });

  it("a fonte do site público entra só pelo PublicShell, nunca pelo HtmlShell", () => {
    expect(read("src/components/layout/PublicShell.tsx")).toMatch(/import \{ publicFont \} from "\.\/public-fonts"/);
    expect(read("src/components/layout/PublicShell.tsx")).toMatch(/data-site="public"/);
    const shell = read("src/components/layout/HtmlShell.tsx");
    expect(shell).not.toMatch(/public-fonts|public-theme|Archivo/);
  });
});
