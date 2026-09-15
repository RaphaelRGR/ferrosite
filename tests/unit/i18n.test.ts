import { describe, expect, it } from "vitest";
import { localizePath, negotiateLocale, splitLocale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { pt } from "@/i18n/dictionaries/pt";
import { formatDate, formatList, formatNumber } from "@/i18n/format";

function flatten(obj: object, prefix = ""): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") acc[path] = value;
    else Object.assign(acc, flatten(value as object, path));
    return acc;
  }, {});
}

describe("catálogos PT/EN", () => {
  const flatPt = flatten(pt);
  const flatEn = flatten(en);

  it("têm exatamente as mesmas chaves", () => {
    expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatPt).sort());
  });

  it("não têm strings vazias", () => {
    for (const [key, value] of [...Object.entries(flatPt), ...Object.entries(flatEn)]) {
      expect(value.trim().length, `chave vazia: ${key}`).toBeGreaterThan(0);
    }
  });

  it("não deixam texto PT em chaves de interface do EN (exceto nomes próprios)", () => {
    const allowedSame = new Set([
      "site.campus", "nav.portal", "locale.pt", "locale.en", "locale.ptShort", "locale.enShort",
      "nav.projectLinks.comunicaFerro", "nav.projectLinks.cavalosDeFerro", "nav.projectLinks.ferroLab", "auth.email", "portal.name",
    ]);
    const same = Object.keys(flatPt).filter((k) => flatPt[k] === flatEn[k] && !allowedSame.has(k));
    expect(same).toEqual([]);
  });
});

describe("rotas por locale", () => {
  it("separa e prefixa caminhos", () => {
    expect(splitLocale("/en/curso")).toEqual({ locale: "en", rest: "/curso" });
    expect(splitLocale("/curso")).toEqual({ locale: null, rest: "/curso" });
    expect(splitLocale("/pt")).toEqual({ locale: "pt", rest: "/" });
    expect(localizePath("en", "/curso")).toBe("/en/curso");
    expect(localizePath("pt", "/en/curso")).toBe("/pt/curso");
    expect(localizePath("en", "/")).toBe("/en");
  });

  it("negocia Accept-Language respeitando q e ordem", () => {
    expect(negotiateLocale("en-US,en;q=0.9,pt;q=0.8")).toBe("en");
    expect(negotiateLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(negotiateLocale("fr-FR,fr;q=0.9")).toBe("pt");
    expect(negotiateLocale("fr;q=0.9,en;q=0.5")).toBe("en");
    expect(negotiateLocale(null)).toBe("pt");
  });
});

describe("formatação Intl", () => {
  const date = new Date(Date.UTC(2026, 8, 14, 15, 0));
  it("formata data por locale no fuso institucional", () => {
    expect(formatDate("pt", date)).toMatch(/14 de setembro de 2026/);
    expect(formatDate("en", date)).toMatch(/September 14, 2026/);
  });
  it("formata números e listas por locale", () => {
    expect(formatNumber("pt", 1234.5)).toBe("1.234,5");
    expect(formatNumber("en", 1234.5)).toBe("1,234.5");
    expect(formatList("pt", ["a", "b", "c"])).toBe("a, b e c");
    expect(formatList("en", ["a", "b", "c"])).toBe("a, b, and c");
  });
});
