import c2012 from "../../content/curriculum/2012.json";
import c2016 from "../../content/curriculum/2016.json";
import c2025 from "../../content/curriculum/2025.json";

/**
 * Fonte canônica curricular (FLOW-001): content/curriculum/<ano>.json, gerado
 * dos PDFs oficiais "CURRÍCULO DO CURSO" (SeTIC/UFSC) por
 * scripts/curriculum_from_pdf.py. Não editar os JSON à mão: regenerar.
 *
 * Categorias, nomes curtos e flag de extensão são metadados de apresentação
 * herdados do protótipo (content/curriculum/legacy-prototype.ts, mantido como insumo
 * do gerador). A grade 2012 não traz pré-requisitos no PDF: suas arestas são
 * as legadas, marcadas `prerequisitesSource: "legacy-unverified"`.
 */
export type SubjectCategory =
  | "math" | "physics" | "mech" | "fluid" | "elec" | "railway"
  | "material" | "human" | "design" | "comp" | "project" | "mgmt";

export interface Subject {
  id: string;
  /** Nome oficial (PDF). */
  name: string;
  /** Nome curto para cards/rótulos. */
  shortName: string;
  cat: SubjectCategory;
  hours: number;
  classesPerWeek: number | null;
  /** Pré-requisitos obrigatórios (todos). */
  pre: string[];
  /** Grupos de alternativas: basta um de cada grupo. */
  preAny: string[][];
  equivalents: string[];
  ext: boolean;
  /** Ementa oficial (PDF); vazia para slots/atividades. */
  syllabus: string;
}

export interface Phase {
  phase: number;
  subjects: Subject[];
}

export interface CurriculumData {
  id: string;
  year: number;
  name: { pt: string; en: string };
  source: { file: string; sha256: string; title: string; curriculumCode: string; extractedAt: string; tool: string };
  prerequisitesSource: "pdf" | "legacy-unverified";
  /** Códigos citados como pré-requisito que não pertencem a este currículo (constam no PDF). */
  unknownPrerequisites: string[];
  phases: Phase[];
  optatives: Subject[];
  activities: Subject[];
}

function load(raw: unknown): CurriculumData {
  return raw as CurriculumData;
}

export const CURRICULUMS: CurriculumData[] = [load(c2025), load(c2016), load(c2012)];

export function allSubjects(c: CurriculumData): Subject[] {
  return [...c.phases.flatMap((p) => p.subjects), ...c.optatives, ...c.activities];
}

/** Todos os códigos exigidos por uma disciplina (obrigatórios + alternativas), para desenhar arestas. */
export function prerequisiteCodes(s: Subject): string[] {
  return [...s.pre, ...s.preAny.flat()];
}
