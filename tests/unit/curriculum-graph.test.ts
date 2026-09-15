import { describe, expect, it } from "vitest";
import { CURRICULUMS } from "@/data/curriculums";
import { ancestors, buildGraph, descendants, neighborhood, searchSubjects } from "@/lib/curriculum/graph";

const c2025 = CURRICULUMS.find((c) => c.year === 2025)!;
const c2012 = CURRICULUMS.find((c) => c.year === 2012)!;

describe("grafo curricular (funções puras)", () => {
  const g = buildGraph(c2025);

  it("ancestrais são transitivos: Dinâmica Ferroviária exige Cálculo I lá no começo", () => {
    const anc = ancestors(g, "EMB5544");
    expect(anc.has("EMB5535")).toBe(true); // Via Permanente (direto)
    expect(anc.has("EMB5011")).toBe(true); // Estática (via Via Permanente)
    expect(anc.has("EMB5001")).toBe(true); // Cálculo I (raiz)
    expect(anc.has("EMB5544")).toBe(false);
  });

  it("dependentes são transitivos e simétricos aos ancestrais", () => {
    const desc = descendants(g, "EMB5001");
    expect(desc.has("EMB5544")).toBe(true);
    for (const id of desc) expect(ancestors(g, id).has("EMB5001")).toBe(true);
  });

  it("vizinhança traz diretos, transitivos e arestas de ambos os lados", () => {
    const n = neighborhood(g, "EMB5535");
    expect(n.directPrereqs).toEqual(expect.arrayContaining(["EMB5011", "EMB5012"]));
    expect(n.directDependents).toEqual(expect.arrayContaining(["EMB5542", "EMB5544"]));
    expect(n.edges.some(([from, to, kind]) => from === "EMB5011" && to === "EMB5535" && kind === "ancestor")).toBe(true);
    expect(n.edges.some(([from, to, kind]) => from === "EMB5535" && to === "EMB5544" && kind === "descendant")).toBe(true);
    expect(n.edges.every(([from, to]) => g.byId.has(from) && g.byId.has(to))).toBe(true);
  });

  it("inclui optativas no grafo (2012: EMB5512 -> EMB5107 passa a ter aresta desenhável)", () => {
    const g12 = buildGraph(c2012);
    expect(g12.prereqs.get("EMB5512")).toContain("EMB5107");
    expect(g12.phaseOf.get("EMB5107")).toBeUndefined();
  });

  it("busca por código ou nome, sem acento", () => {
    expect(searchSubjects(c2025, "emb5535").map((s) => s.id)).toEqual(["EMB5535"]);
    expect(searchSubjects(c2025, "dinamica").some((s) => s.id === "EMB5544")).toBe(true);
    expect(searchSubjects(c2025, "")).toEqual([]);
  });
});
