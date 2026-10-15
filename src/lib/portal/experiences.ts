/**
 * Regras puras das experiências criadas pelo Portal (EXP-001). O site decide o tipo pelo começo do
 * título (`experienceKind` em components/public/experiences/ExperienceCard.tsx), então o formulário
 * monta o título a partir do tipo + nome, e desmonta para editar.
 */
export const EXPERIENCE_KINDS = ["visit", "talk", "event"] as const;
export type ExperienceFormKind = (typeof EXPERIENCE_KINDS)[number];

const PREFIX: Record<ExperienceFormKind, string> = { visit: "Visita técnica: ", talk: "Palestra: ", event: "" };

export function composeExperienceTitle(kind: ExperienceFormKind, name: string): string {
  const clean = name.trim().replace(/\s+/g, " ");
  return `${PREFIX[kind]}${clean}`;
}

export function splitExperienceTitle(title: string): { kind: ExperienceFormKind; name: string } {
  const m = /^visita(?:\s+t[ée]cnica)?\s*[:·-]?\s*/i.exec(title);
  if (m) return { kind: "visit", name: title.slice(m[0].length) };
  const p = /^palestra\s*[:·-]?\s*/i.exec(title);
  if (p) return { kind: "talk", name: title.slice(p[0].length) };
  return { kind: "event", name: title };
}

/** Nomes que a câmera/celular gera: não descrevem a foto. */
const CAMERA_NAME = /^(img|dsc|dscn|dcim|pxl|mvimg|photo|foto|whatsapp image|screenshot|captura)[\s_-]*\d|^\d{6,}|^\d{4}[-_]\d{2}[-_]\d{2}|^[\d\s_().-]+$/i;

/**
 * Descrição (texto alternativo) a partir do nome do arquivo: `Grupo_com_locomotiva_02.jpg` vira
 * "Grupo com locomotiva". Nome de câmera vira "<título> (foto N)". Sempre editável depois.
 */
export function photoAltFromName(fileName: string, title: string, n: number): string {
  const base = fileName.replace(/\.[a-z0-9]{2,5}$/i, "").trim();
  if (!base || CAMERA_NAME.test(base)) return `${title} (foto ${n})`.slice(0, 300);
  const words = base
    .replace(/[_]+/g, " ")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s*\(\d+\)\s*$/, "")
    .replace(/\s+\d{1,3}$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!words || /^\d+$/.test(words)) return `${title} (foto ${n})`.slice(0, 300);
  return (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 300);
}
