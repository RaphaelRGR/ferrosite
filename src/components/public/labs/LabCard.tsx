import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { capabilitiesOf, type CapabilityLevel } from "@/content/capabilities";
import { getLab, hasDetail, type Lab } from "@/content/labs";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export const LEVEL_TONE: Record<CapabilityLevel, "info" | "neutral"> = { offered: "info", prospective: "neutral", pending: "neutral" };

export function levelLabel(level: CapabilityLevel, dict: Dictionary["labs"]): string {
  return level === "offered" ? dict.levelOffered : level === "prospective" ? dict.levelProspective : dict.levelPending;
}

/** Selo de capacidade com nível (14): nível não depende só de cor — sufixo * e texto sr-only. */
export function CapabilityBadge({ capability, level, dict, capabilityNames }: { capability: keyof Dictionary["capabilities"]; level: CapabilityLevel; dict: Dictionary["labs"]; capabilityNames: Dictionary["capabilities"] }) {
  return (
    <Badge tone={LEVEL_TONE[level]}>
      {capabilityNames[capability]}
      {level === "prospective" && <span aria-hidden="true">*</span>}
      {level !== "offered" && <span className="sr-only">, {levelLabel(level, dict)}</span>}
    </Badge>
  );
}

/**
 * Linha de laboratório no hub (DESIGN-D, ficha técnica): sigla grande, nome, primeira frase do portfólio
 * (ou a pendência explícita), capacidades com nível e "Ver laboratório" cobrindo a linha inteira.
 */
export function LabCard({ lab, locale, dict, capabilityNames }: { lab: Lab; locale: Locale; dict: Dictionary["labs"]; capabilityNames: Dictionary["capabilities"] }) {
  const links = capabilitiesOf(lab.id);
  const duplicateAcronym = lab.duplicateOf ? getLab(lab.duplicateOf)?.acronym ?? lab.duplicateOf : null;
  const detailed = hasDetail(lab);
  return (
    <li className="group relative grid gap-3 border-b border-line py-7 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] md:gap-8">
      <p className={`f-display text-3xl font-black leading-none md:text-4xl ${detailed ? "text-link" : "text-fg-muted"}`}>{lab.acronym}</p>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-xl font-bold leading-snug">{lab.name}</h2>
        {detailed ? (
          <p className="max-w-[70ch] text-fg-muted">{lab.about[0]}</p>
        ) : (
          <p className="max-w-[70ch] text-sm text-fg-muted">{duplicateAcronym ? dict.duplicateNotice.replace("{lab}", duplicateAcronym) : dict.indexOnly}</p>
        )}
        {links.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={dict.capabilities}>
            {links.map((l) => (
              <li key={l.capability}>
                <CapabilityBadge capability={l.capability} level={l.level} dict={dict} capabilityNames={capabilityNames} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        href={localizePath(locale, `/laboratorios/${lab.id}`)}
        className="inline-flex items-center gap-1 self-start rounded text-sm font-bold text-link underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:self-center"
      >
        {dict.detail} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </li>
  );
}
