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

// Contraste WCAG dos pares da faixa escura (texto ≥ 4,5:1; marcadores gráficos ≥ 3:1).
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("faixa escura de eventos: contraste", () => {
  const css = read("src/components/layout/public-theme.css");
  const v = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i"))?.[1] ?? "";
  it.each(["board-fg", "board-muted", "board-date"])("%s sobre board-bg ≥ 4,5:1", (t) => {
    expect(ratio(v(t), v("board-bg"))).toBeGreaterThanOrEqual(4.5);
  });
  it.each(["board-brasil", "board-mundo"])("%s sobre board-bg ≥ 3:1", (t) => {
    expect(ratio(v(t), v("board-bg"))).toBeGreaterThanOrEqual(3);
  });
});
