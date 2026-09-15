import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import { isActivePath, portalNavItems, visibleNavItems } from "@/lib/portal/navigation";
import { initialHtmlTheme, parseTheme } from "@/lib/portal/theme";

describe("navegação do Portal", () => {
  const items = portalNavItems(getDictionary("pt").portal);

  it("só lista rotas existentes e rotuladas pelo catálogo", () => {
    expect(items.map((i) => i.href)).toEqual(["/portal", "/portal/projetos", "/portal/configuracoes"]);
    for (const i of items) expect(i.label.length).toBeGreaterThan(0);
  });

  it("filtra por papel quando o item exige e mostra todos a contas ativas sem exigência", () => {
    const withAdminOnly = [...items, { href: "/portal/pessoas", label: "Pessoas", icon: "", requires: ["admin" as const] }];
    expect(visibleNavItems(withAdminOnly, { global_role: "member" }).map((i) => i.href)).not.toContain("/portal/pessoas");
    expect(visibleNavItems(withAdminOnly, { global_role: "admin" }).map((i) => i.href)).toContain("/portal/pessoas");
    expect(visibleNavItems(withAdminOnly, null)).toHaveLength(items.length);
  });

  it("marca o item ativo pelo prefixo, exceto o início que é exato", () => {
    expect(isActivePath("/portal", "/portal")).toBe(true);
    expect(isActivePath("/portal/projetos", "/portal")).toBe(false);
    expect(isActivePath("/portal/projetos/abc", "/portal/projetos")).toBe(true);
    expect(isActivePath("/portal/projetosx", "/portal/projetos")).toBe(false);
  });
});

describe("tema do Portal", () => {
  it("aceita só light/dark/system e cai em system", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("weird")).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
  });
  it("system e light começam claros no servidor; dark começa escuro", () => {
    expect(initialHtmlTheme("system")).toBe("light");
    expect(initialHtmlTheme("dark")).toBe("dark");
  });
});
