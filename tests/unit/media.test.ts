import { describe, expect, it } from "vitest";
import { MEDIA_PRESETS, MEDIA_WIDTHS, mediaImage, mediaSrcSet, mediaUrl } from "@/lib/content/media";

const ID = "c1d54a13-a719-405f-9166-7bdc49683b45";

describe("URLs da mídia pública (22)", () => {
  it("sem largura entrega o original; com largura pede a miniatura", () => {
    expect(mediaUrl(ID)).toBe(`/api/midia/${ID}`);
    expect(mediaUrl(ID, 480)).toBe(`/api/midia/${ID}?w=480`);
  });

  it("srcset usa descritor de largura em ordem crescente", () => {
    expect(mediaSrcSet(ID, [320, 640])).toBe(`/api/midia/${ID}?w=320 320w, /api/midia/${ID}?w=640 640w`);
  });

  it("todo preset só usa larguras permitidas pela rota e tem um fallback entre elas", () => {
    for (const [name, p] of Object.entries(MEDIA_PRESETS)) {
      expect(p.widths.length, name).toBeGreaterThan(0);
      for (const w of p.widths) expect(MEDIA_WIDTHS, `${name}: ${w}`).toContain(w);
      expect(p.widths, `${name}: fallback`).toContain(p.fallback);
      expect([...p.widths], `${name}: crescente`).toEqual([...p.widths].sort((a, b) => a - b));
    }
  });

  it("listas e galerias nunca apontam para o original", () => {
    for (const preset of ["hero", "card", "article", "thumb", "full"] as const) {
      const img = mediaImage(ID, preset);
      expect(img.src, preset).toContain("?w=");
      expect(img.srcSet, preset).toContain("?w=");
      expect(img.sizes.length, preset).toBeGreaterThan(0);
    }
  });
});
