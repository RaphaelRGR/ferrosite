import inventory from "../../content/editorial-inventory.json";

/**
 * Quarentena editorial (BASE-002). Fonte: content/editorial-inventory.json.
 * Nenhuma afirmação institucional é apresentada como fato sem VERIFIED
 * (fonte + owner + verified_at). Componentes marcam seções com
 * <UnverifiedContent section="..."> e a política de renderização decide.
 */
export type ContentStatus = "UNVERIFIED" | "VERIFIED" | "DISCARDED";
export type ContentDecision = "confirmar" | "corrigir" | "descartar" | null;
export type ContentMode = "review" | "strict";

export interface ContentEntry {
  content_id: string;
  kind: string;
  value_pt: string;
  value_en: string | null;
  source: string | null;
  source_url: string | null;
  owner: string | null;
  status: ContentStatus;
  verified_at: string | null;
  next_review: string | null;
  classification: string;
  consent_or_license: string | null;
  decision: ContentDecision;
  notes: string | null;
}

export interface ContentSection {
  id: string;
  route: string;
  component: string;
  title: string;
  entries: ContentEntry[];
}

type RawEntry = Partial<ContentEntry> & { content_id: string; kind: string; value_pt: string };

function withDefaults(raw: RawEntry): ContentEntry {
  return {
    value_en: null,
    source: null,
    source_url: null,
    owner: null,
    status: "UNVERIFIED",
    verified_at: null,
    next_review: null,
    classification: "public",
    consent_or_license: null,
    decision: null,
    notes: null,
    ...raw,
  } as ContentEntry;
}

export const CONTENT_SECTIONS: ContentSection[] = (inventory.sections as Array<Omit<ContentSection, "entries"> & { entries: RawEntry[] }>).map(
  (section) => ({ ...section, entries: section.entries.map(withDefaults) }),
);

const SECTION_INDEX = new Map(CONTENT_SECTIONS.map((s) => [s.id, s]));

/**
 * Entradas descartadas saem do cálculo (o conteúdo delas já não é exibido).
 * A seção é DISCARDED só se todas forem; VERIFIED se todas as restantes estiverem
 * VERIFIED com decisão de confirmar; senão UNVERIFIED (com selo).
 */
export function sectionStatus(id: string): ContentStatus {
  const section = SECTION_INDEX.get(id);
  if (!section) throw new Error(`Seção de conteúdo desconhecida: ${id}`);
  const live = section.entries.filter((e) => e.status !== "DISCARDED" && e.decision !== "descartar");
  if (live.length === 0) return "DISCARDED";
  if (live.every((e) => e.status === "VERIFIED" && e.decision === "confirmar")) return "VERIFIED";
  return "UNVERIFIED";
}

/**
 * review: conteúdo não verificado aparece com marca visível (preview, local, CI).
 * strict: não renderiza — é o padrão na produção da Vercel (next.config.ts, a
 * partir de VERCEL_ENV), para que placeholder nunca seja lido como fato (04).
 * NEXT_PUBLIC_CONTENT_MODE explícito sempre vence; o valor é fixado no build.
 */
export function contentMode(): ContentMode {
  return process.env.NEXT_PUBLIC_CONTENT_MODE === "strict" ? "strict" : "review";
}

/** A seção aparece no modo atual? Páginas usam isto para não sobrar um esqueleto vazio em `strict`. */
export function isSectionVisible(id: string, mode: ContentMode = contentMode()): boolean {
  return shouldRender(sectionStatus(id), mode);
}

export function shouldRender(status: ContentStatus, mode: ContentMode = contentMode()): boolean {
  if (status === "DISCARDED") return false;
  if (status === "VERIFIED") return true;
  return mode === "review";
}
