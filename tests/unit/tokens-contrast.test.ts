import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Lê os tokens de src/app/globals.css e verifica contraste WCAG 2.x dos pares
 * semânticos em cada tema. Falha se um token mudar para um valor abaixo de AA.
 */
const css = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`bloco ${selector} não encontrado`);
  const body = css.slice(start, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const LIGHT_SELECTOR = ':root,\n[data-theme="light"]';
const primitives = block(":root");
const light = { ...primitives, ...block(LIGHT_SELECTOR) };
const themes = {
  light,
  dark: { ...primitives, ...block('[data-theme="dark"]') },
};

function resolve(vars: Record<string, string>, name: string): string {
  let value = vars[name];
  for (let i = 0; i < 5 && value?.startsWith("var("); i++) value = vars[value.slice(4, -1).trim()];
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`token ${name} não resolve para hex: ${value}`);
  return value;
}

function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [primeiro plano, fundo, mínimo] — 4,5 texto normal; 3 componentes/UI e texto grande.
const PAIRS: Array<[string, string, number]> = [
  ["--text-primary", "--bg-canvas", 4.5],
  ["--text-primary", "--bg-surface", 4.5],
  ["--text-primary", "--bg-surface-2", 4.5],
  ["--text-muted", "--bg-canvas", 4.5],
  ["--text-muted", "--bg-surface", 4.5],
  ["--text-muted", "--bg-surface-2", 4.5],
  ["--text-on-action", "--action-primary", 4.5],
  ["--action-primary", "--bg-canvas", 3],
  ["--text-link", "--bg-canvas", 4.5],
  ["--text-link", "--bg-surface", 4.5],
  ["--text-link", "--bg-surface-2", 4.5],
  ["--text-on-action", "--action-primary-hover", 4.5],
  ["--accent", "--bg-canvas", 3],
  ["--focus-ring", "--bg-canvas", 3],
  ["--focus-ring", "--bg-surface", 3],
  ["--border-strong", "--bg-surface", 3],
  ["--status-success", "--bg-surface", 4.5],
  ["--status-warning", "--bg-surface", 4.5],
  ["--status-danger", "--bg-surface", 4.5],
  ["--status-info", "--bg-surface", 4.5],
];

describe.each(Object.entries(themes))("tema %s", (_name, vars) => {
  it.each(PAIRS)("%s sobre %s ≥ %s:1", (fg, bg, min) => {
    const ratio = contrast(resolve(vars, fg), resolve(vars, bg));
    expect(
      ratio,
      `${fg} (${resolve(vars, fg)}) sobre ${bg} (${resolve(vars, bg)}) = ${ratio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(min);
  });
});

it("o tema claro é um escopo explícito (não só :root), para não herdar o escuro quando aninhado", () => {
  expect(Object.keys(block(LIGHT_SELECTOR))).toContain("--bg-canvas");
});

it("o laranja institucional não é usado como fundo de ação com texto branco (3,78:1 falha AA)", () => {
  for (const vars of Object.values(themes)) {
    expect(contrast("#ffffff", resolve(vars, "--action-primary"))).toBeGreaterThanOrEqual(4.5);
  }
});
