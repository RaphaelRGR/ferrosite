import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { allSubjects, CURRICULUMS, prerequisiteCodes, type CurriculumData, type Subject } from "@/data/curriculums";

/**
 * Invariantes das três matrizes (FLOW-001). A fonte canônica são os JSON
 * gerados dos PDFs oficiais; estes testes protegem estrutura e grafo.
 * Divergências conhecidas ficam em KNOWN_EXCEPTIONS: o teste falha tanto se
 * surgir uma nova quanto se uma conhecida sumir sem atualizar a lista.
 */
const EXPECTED_YEARS = [2025, 2016, 2012] as const;
const EXPECTED_PHASES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Snapshot estrutural extraído dos PDFs (2026-09-15).
const EXPECTED_COUNTS: Record<number, { main: number; optatives: number }> = {
  2025: { main: 62, optatives: 24 },
  2016: { main: 61, optatives: 28 },
  2012: { main: 61, optatives: 7 },
};

const KNOWN_CATEGORIES = new Set([
  "math", "physics", "mech", "fluid", "elec", "railway",
  "material", "human", "design", "comp", "project", "mgmt",
]);

const KNOWN_EXCEPTIONS = {
  // Obrigatória cujo pré-requisito está apenas nas optativas (aresta não desenhável até FLOW-002 incluir optativas).
  mainRequiresOptative: {
    2025: [],
    2016: [],
    // 2012: pré-requisitos legados sem fonte no PDF (prerequisitesSource = legacy-unverified).
    2012: ["EMB5512->EMB5107"],
  } as Record<number, string[]>,
  // Pré-requisito declarado na mesma fase. Em 2012 o PDF não traz pré-requisitos; a aresta é legada
  // (EMB5605 e EMB5116 estão ambas na fase 6 no PDF). [CONTEÚDO PENDENTE] até a coordenação confirmar.
  samePhasePrerequisite: { 2025: [], 2016: [], 2012: ["EMB5605->EMB5116"] } as Record<number, string[]>,
};

function mainSubjects(c: CurriculumData): Subject[] {
  return c.phases.flatMap((p) => p.subjects);
}

function edges(subjects: Subject[]): Array<[string, string]> {
  return subjects.flatMap((s) => prerequisiteCodes(s).map((pre): [string, string] => [s.id, pre]));
}

/** Detecta ciclos no grafo de pré-requisitos (DFS com três cores). */
function findCycle(subjects: Subject[]): string[] | null {
  const preOf = new Map(subjects.map((s) => [s.id, prerequisiteCodes(s)]));
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

  it("cada matriz declara nome PT/EN, fonte (PDF oficial) e origem dos pré-requisitos", () => {
    for (const c of CURRICULUMS) {
      expect(c.name.pt.length).toBeGreaterThan(0);
      expect(c.name.en.length).toBeGreaterThan(0);
      expect(c.source.file).toMatch(/^public\/grades\/grade\d{4}\.pdf$/);
      expect(c.source.curriculumCode).toMatch(/^\d{5}$/);
      expect(["pdf", "legacy-unverified"]).toContain(c.prerequisitesSource);
    }
    expect(CURRICULUMS.find((c) => c.year === 2012)?.prerequisitesSource).toBe("legacy-unverified");
  });

  it("o JSON foi gerado do PDF atual (sha256 confere): trocar o PDF exige regenerar", () => {
    for (const c of CURRICULUMS) {
      const sha = createHash("sha256").update(readFileSync(path.resolve(process.cwd(), c.source.file))).digest("hex");
      expect(sha, `${c.source.file} mudou; rode scripts/curriculum_from_pdf.py`).toBe(c.source.sha256);
    }
  });
});

describe.each(CURRICULUMS.map((c) => [c.year, c] as const))("matriz %i", (year, curriculum) => {
  const main = mainSubjects(curriculum);
  const all = allSubjects(curriculum);
  const mainIds = new Set(main.map((s) => s.id));
  const optIds = new Set(curriculum.optatives.map((s) => s.id));
  const phaseOf = new Map<string, number>();
  curriculum.phases.forEach((p) => p.subjects.forEach((s) => phaseOf.set(s.id, p.phase)));

  it("tem dez fases numeradas de 1 a 10, cada uma com ao menos uma disciplina", () => {
    expect(curriculum.phases.map((p) => p.phase)).toEqual(EXPECTED_PHASES);
    for (const p of curriculum.phases) expect(p.subjects.length).toBeGreaterThan(0);
  });

  it("mantém a contagem de disciplinas obrigatórias e optativas do snapshot", () => {
    expect({ main: main.length, optatives: curriculum.optatives.length }).toEqual(EXPECTED_COUNTS[year]);
  });

  it("não tem IDs duplicados entre obrigatórias, optativas e atividades", () => {
    const ids = all.map((s) => s.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it("toda disciplina tem id, nomes, categoria conhecida e carga horária inteira positiva", () => {
    const ID_PATTERN = /^([A-Z]{3}\d{4}|OPT-\d+)$/;
    for (const s of all) {
      expect(s.id, `id inválido em ${JSON.stringify(s)}`).toMatch(ID_PATTERN);
      expect(s.name.trim().length, `nome vazio em ${s.id}`).toBeGreaterThan(0);
      expect(s.shortName.trim().length, `nome curto vazio em ${s.id}`).toBeGreaterThan(0);
      expect(KNOWN_CATEGORIES.has(s.cat), `categoria desconhecida "${s.cat}" em ${s.id}`).toBe(true);
      expect(Number.isInteger(s.hours) && s.hours > 0, `carga inválida em ${s.id}: ${s.hours}`).toBe(true);
    }
  });

  it("disciplinas com código oficial têm ementa (exceto atividades/estágio)", () => {
    const missing = all.filter((s) => /^[A-Z]{3}\d{4}$/.test(s.id) && s.cat !== "project" && !s.syllabus.trim()).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("todo pré-requisito referencia uma disciplina do currículo ou consta em unknownPrerequisites", () => {
    const known = new Set(all.map((s) => s.id));
    const unknown = new Set(curriculum.unknownPrerequisites);
    const missing = edges(all).filter(([, pre]) => !known.has(pre) && !unknown.has(pre)).map(([id, pre]) => `${id}->${pre}`);
    expect(missing).toEqual([]);
    // e nada listado como desconhecido pode, na verdade, existir
    expect([...unknown].filter((c) => known.has(c))).toEqual([]);
  });

  it("nenhuma disciplina é pré-requisito de si mesma e o grafo é acíclico", () => {
    expect(edges(all).filter(([id, pre]) => id === pre)).toEqual([]);
    expect(findCycle(all)).toBeNull();
  });

  it("obrigatórias que dependem de optativas correspondem exatamente às exceções conhecidas", () => {
    const found = edges(main)
      .filter(([, pre]) => !mainIds.has(pre) && optIds.has(pre))
      .map(([id, pre]) => `${id}->${pre}`)
      .sort();
    expect(found).toEqual([...KNOWN_EXCEPTIONS.mainRequiresOptative[year]].sort());
  });

  it("pré-requisitos ficam em fase anterior, exceto as divergências registradas", () => {
    const found = edges(main)
      .filter(([id, pre]) => phaseOf.has(pre) && phaseOf.get(pre)! >= phaseOf.get(id)!)
      .map(([id, pre]) => `${id}->${pre}`)
      .sort();
    expect(found).toEqual([...KNOWN_EXCEPTIONS.samePhasePrerequisite[year]].sort());
  });
});
