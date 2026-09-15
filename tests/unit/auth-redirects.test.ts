import { describe, expect, it } from "vitest";
import { PORTAL_HOME, safeNextPath } from "@/lib/auth/redirects";

describe("allowlist de redirecionamento pós-login (21: open redirect)", () => {
  it("aceita apenas caminhos internos do Portal", () => {
    expect(safeNextPath("/portal")).toBe("/portal");
    expect(safeNextPath("/portal/projetos?x=1")).toBe("/portal/projetos?x=1");
  });
  it("rejeita destinos externos, protocol-relative, fora do Portal e malformados", () => {
    for (const bad of [
      "https://evil.example", "//evil.example", "/pt", "/portalx", "/login", "", null, undefined,
      "/portal/../../etc", "\\evil", "/portal/\nfoo", "javascript:alert(1)",
    ]) {
      expect(safeNextPath(bad), String(bad)).toBe(PORTAL_HOME);
    }
  });
});
