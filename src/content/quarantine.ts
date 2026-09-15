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

export function getContentSection(id: string): ContentSection | undefined {
  return SECTION_INDEX.get(id);
}

/** Uma seção é publicável sem marca quando todas as entradas estão VERIFIED com decisão de confirmar. */
export function sectionStatus(id: string): ContentStatus {
  const section = SECTION_INDEX.get(id);
  if (!section) throw new Error(`Seção de conteúdo desconhecida: ${id}`);
  if (section.entries.some((e) => e.status === "DISCARDED" || e.decision === "descartar")) return "DISCARDED";
  if (section.entries.every((e) => e.status === "VERIFIED" && e.decision === "confirmar")) return "VERIFIED";
  return "UNVERIFIED";
}

/**
 * review (default): conteúdo não verificado aparece com marca visível.
 * strict (NEXT_PUBLIC_CONTENT_MODE=strict, inlined no build): não renderiza.
 * Default é review porque não há deploy de produção antes do gate de F5 (29)
 * e a marca visível já impede que o conteúdo seja lido como fato.
 */
export function contentMode(): ContentMode {
  return process.env.NEXT_PUBLIC_CONTENT_MODE === "strict" ? "strict" : "review";
}

export function shouldRender(status: ContentStatus, mode: ContentMode = contentMode()): boolean {
  if (status === "DISCARDED") return false;
  if (status === "VERIFIED") return true;
  return mode === "review";
}
