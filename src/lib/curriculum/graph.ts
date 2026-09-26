import { allSubjects, prerequisiteCodes, type CurriculumData, type Subject } from "@/content/curriculums";

/**
 * Funções puras do grafo curricular (09): ancestrais (pré-requisitos
 * transitivos), dependentes (transitivos), vizinhança e lookup. Independentes
 * de DOM para serem testáveis e reutilizáveis (lista, grafo, painel).
 */
export interface CurriculumGraph {
  byId: Map<string, Subject>;
  /** id -> pré-requisitos diretos (obrigatórios + alternativas), só os existentes no currículo */
  prereqs: Map<string, string[]>;
  /** id -> disciplinas que o exigem diretamente */
  dependents: Map<string, string[]>;
  /** id -> fase (undefined para optativas/atividades) */
  phaseOf: Map<string, number>;
}

export function buildGraph(curriculum: CurriculumData): CurriculumGraph {
  const subjects = allSubjects(curriculum);
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const prereqs = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();
  const phaseOf = new Map<string, number>();
  for (const p of curriculum.phases) for (const s of p.subjects) phaseOf.set(s.id, p.phase);
  for (const s of subjects) {
    const pres = prerequisiteCodes(s).filter((c) => byId.has(c));
    prereqs.set(s.id, pres);
    for (const pre of pres) dependents.set(pre, [...(dependents.get(pre) ?? []), s.id]);
  }
  return { byId, prereqs, dependents, phaseOf };
}

function closure(start: string, next: Map<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const stack = [...(next.get(start) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const n of next.get(id) ?? []) if (!seen.has(n)) stack.push(n);
  }
  return seen;
}

/** Pré-requisitos transitivos (o que precisa vir antes). */
export function ancestors(graph: CurriculumGraph, id: string): Set<string> {
  return closure(id, graph.prereqs);
}

/** Disciplinas que dependem, direta ou indiretamente, desta. */
export function descendants(graph: CurriculumGraph, id: string): Set<string> {
  return closure(id, graph.dependents);
}

export interface Neighborhood {
  id: string;
  ancestors: Set<string>;
  descendants: Set<string>;
  directPrereqs: string[];
  directDependents: string[];
  /** arestas a desenhar: [de (pré-requisito), para (dependente), tipo] */
  edges: Array<[string, string, "ancestor" | "descendant"]>;
}

export function neighborhood(graph: CurriculumGraph, id: string): Neighborhood {
  const anc = ancestors(graph, id);
  const desc = descendants(graph, id);
  const edges: Neighborhood["edges"] = [];
  for (const node of [id, ...anc]) for (const pre of graph.prereqs.get(node) ?? []) if (pre === id || anc.has(pre)) edges.push([pre, node, "ancestor"]);
  for (const node of [id, ...desc]) for (const dep of graph.dependents.get(node) ?? []) if (desc.has(dep)) edges.push([node, dep, "descendant"]);
  return {
    id,
    ancestors: anc,
    descendants: desc,
    directPrereqs: graph.prereqs.get(id) ?? [],
    directDependents: graph.dependents.get(id) ?? [],
    edges,
  };
}

/** Busca por código ou nome (case/acento-insensível). */
export function searchSubjects(curriculum: CurriculumData, query: string): Subject[] {
  const q = normalize(query);
  if (!q) return [];
  return allSubjects(curriculum).filter((s) => normalize(s.id).includes(q) || normalize(s.name).includes(q) || normalize(s.shortName).includes(q));
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
