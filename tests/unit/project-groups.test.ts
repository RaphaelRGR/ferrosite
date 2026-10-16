import { describe, expect, it } from "vitest";
import { groupByCategory } from "@/lib/content/project-groups";

describe("projetos por categoria (DESIGN-D)", () => {
  it("agrupa na ordem da primeira aparição e preserva a ordem dentro do grupo", () => {
    const list = [
      { id: "a", category: "communication" },
      { id: "b", category: "extension" },
      { id: "c", category: "rd" },
      { id: "d", category: "extension" },
      { id: "e", category: "rd" },
    ];
    expect(groupByCategory(list).map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([
      ["communication", ["a"]],
      ["extension", ["b", "d"]],
      ["rd", ["c", "e"]],
    ]);
  });
  it("lista vazia não gera grupo", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
