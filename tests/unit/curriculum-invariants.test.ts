import { describe, expect, it } from "vitest";
import { CURRICULUMS, type CurriculumData, type Subject } from "@/data/curriculums";

/**
 * Invariantes das três matrizes curriculares (2025, 2016, 2012).
 *
 * Estes testes protegem os dados contra regressão acidental. Eles NÃO validam
 * o conteúdo contra a fonte oficial (PDF/PPC) — isso é escopo de FLOW-001.
 * Divergências já conhecidas ficam registradas em KNOWN_EXCEPTIONS: o teste
 * falha tanto se surgir uma divergência nova quanto se uma conhecida for
 * removida sem atualizar a lista (para forçar registro explícito da decisão).
 */

const EXPECTED_YEARS = [2025, 2016, 2012] as const;
const EXPECTED_PHASES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Snapshot estrutural do dataset atual (auditoria de 2026-09-14).
const EXPECTED_COUNTS: Record<number, { main: number; optativas: number }> = {
  2025: { main: 60, optativas: 15 },
  2016: { main: 61, optativas: 15 },
  2012: { main: 61, optativas: 6 },
};

const KNOWN_CATEGORIES = new Set([
  "math", "physics", "mech", "fluid", "elec", "railway",
  "material", "human", "design", "comp", "project", "mgmt",
]);

const KNOWN_EXCEPTIONS = {
  // Disciplina obrigatória cujo pré-requisito está apenas nas optativas.
  // Como as optativas não geram nós no fluxograma, a aresta não é desenhada hoje.
  mainRequiresOptativa: { 2025: [], 2016: [], 2012: ["EMB5512->EMB5107"] } as Record<number, string[]>,
  // Pré-requisito declarado na mesma fase da disciplina que o exige.
  // [CONTEÚDO PENDENTE] validar contra o PDF oficial em FLOW-001 antes de corrigir.
  samePhasePrerequisite: { 2025: [], 2016: [], 2012: ["EMB5605->EMB5116"] } as Record<number, string[]>,
};

function mainSubjects(c: CurriculumData): Subject[] {
  return c.phases.flatMap((p) => p.subjects);
}

function allSubjects(c: CurriculumData): Subject[] {
  return [...mainSubjects(c), ...c.optativas];
}

function edges(subjects: Subject[]): Array<[string, string]> {
  return subjects.flatMap((s) => (s.pre ?? []).map((pre): [string, string] => [s.id, pre]));
}

/** Detecta ciclos no grafo de pré-requisitos (DFS com três cores). */
function findCycle(subjects: Subject[]): string[] | null {
  const preOf = new Map(subjects.map((s) => [s.id, s.pre ?? []]));
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    const st = state.get(id);
    if (st === "done") return null;
    if (st === "visiting") return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, "visiting");
    stack.push(id);
    for (const pre of preOf.get(id) ?? []) {
      const cycle = visit(pre);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, "done");
    return null;
  };

  for (const s of subjects) {
    const cycle = visit(s.id);
    if (cycle) return cycle;
  }
  return null;
}

describe("catálogo de matrizes", () => {
  it("expõe exatamente as matrizes 2025, 2016 e 2012, nesta ordem", () => {
    expect(CURRICULUMS.map((c) => c.year)).toEqual([...EXPECTED_YEARS]);
    expect(CURRICULUMS.map((c) => c.id)).toEqual(EXPECTED_YEARS.map(String));
  });

  it("cada matriz tem nome não vazio", () => {
    for (const c of CURRICULUMS) expect(c.name.trim().length).toBeGreaterThan(0);
  });
});

describe.each(CURRICULUMS.map((c) => [c.year, c] as const))("matriz %i", (year, curriculum) => {
  const main = mainSubjects(curriculum);
  const all = allSubjects(curriculum);
  const mainIds = new Set(main.map((s) => s.id));
  const optIds = new Set(curriculum.optativas.map((s) => s.id));
  const phaseOf = new Map<string, number>();
  curriculum.phases.forEach((p) => p.subjects.forEach((s) => phaseOf.set(s.id, p.phase)));

  it("tem dez fases numeradas de 1 a 10, cada uma com ao menos uma disciplina", () => {
    expect(curriculum.phases.map((p) => p.phase)).toEqual(EXPECTED_PHASES);
    for (const p of curriculum.phases) expect(p.subjects.length).toBeGreaterThan(0);
  });

  it("mantém a contagem de disciplinas obrigatórias e optativas do snapshot", () => {
    expect({ main: main.length, optativas: curriculum.optativas.length }).toEqual(EXPECTED_COUNTS[year]);
  });

  it("não tem IDs duplicados entre obrigatórias e optativas", () => {
    const ids = all.map((s) => s.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it("toda disciplina tem id, nome, categoria conhecida e carga horária inteira positiva", () => {
    // Código UFSC (ex.: EMB5001, LSB7904) ou slot de optativa obrigatória da grade 2016 (OPT-1..4).
    const ID_PATTERN = /^([A-Z]{3}\d{4}|OPT-\d+)$/;
    for (const s of all) {
      expect(s.id, `id inválido em ${JSON.stringify(s)}`).toMatch(ID_PATTERN);
      expect(s.name.trim().length, `nome vazio em ${s.id}`).toBeGreaterThan(0);
      expect(KNOWN_CATEGORIES.has(s.cat), `categoria desconhecida "${s.cat}" em ${s.id}`).toBe(true);
      expect(Number.isInteger(s.hours) && s.hours > 0, `carga inválida em ${s.id}: ${s.hours}`).toBe(true);
    }
  });

  it("todo pré-requisito referencia uma disciplina existente (obrigatória ou optativa)", () => {
    const known = new Set(all.map((s) => s.id));
    const missing = edges(all).filter(([, pre]) => !known.has(pre)).map(([id, pre]) => `${id}->${pre}`);
    expect(missing).toEqual([]);
  });

  it("nenhuma disciplina é pré-requisito de si mesma", () => {
    const selfLoops = edges(all).filter(([id, pre]) => id === pre).map(([id]) => id);
    expect(selfLoops).toEqual([]);
  });

  it("o grafo de pré-requisitos é acíclico", () => {
    expect(findCycle(all)).toBeNull();
  });

  it("obrigatórias que dependem de optativas correspondem exatamente às exceções conhecidas", () => {
    const found = edges(main)
      .filter(([, pre]) => !mainIds.has(pre) && optIds.has(pre))
      .map(([id, pre]) => `${id}->${pre}`)
      .sort();
    expect(found).toEqual([...KNOWN_EXCEPTIONS.mainRequiresOptativa[year]].sort());
  });

  it("pré-requisitos ficam em fase anterior, exceto as divergências registradas", () => {
    const found = edges(main)
      .filter(([id, pre]) => phaseOf.has(pre) && phaseOf.get(pre)! >= phaseOf.get(id)!)
      .map(([id, pre]) => `${id}->${pre}`)
      .sort();
    expect(found).toEqual([...KNOWN_EXCEPTIONS.samePhasePrerequisite[year]].sort());
  });
});
