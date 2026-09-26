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

/** Card de laboratório (hub): sigla, nome, primeira frase do portfólio, capacidades e pendência explícita. */
export function LabCard({ lab, locale, dict, capabilityNames }: { lab: Lab; locale: Locale; dict: Dictionary["labs"]; capabilityNames: Dictionary["capabilities"] }) {
  const links = capabilitiesOf(lab.id);
  const duplicateAcronym = lab.duplicateOf ? getLab(lab.duplicateOf)?.acronym ?? lab.duplicateOf : null;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex min-w-16 justify-center rounded-lg border border-line bg-canvas px-2 py-1 text-xs font-black text-link">{lab.acronym}</span>
        <p className="font-bold leading-snug">{lab.name}</p>
      </div>
      {hasDetail(lab) ? (
        <p className="text-sm text-fg-muted">{lab.about[0]}</p>
      ) : (
        <p className="text-sm text-fg-muted">{duplicateAcronym ? dict.duplicateNotice.replace("{lab}", duplicateAcronym) : dict.indexOnly}</p>
      )}
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={dict.capabilities}>
          {links.map((l) => (
            <li key={l.capability}>
              <CapabilityBadge capability={l.capability} level={l.level} dict={dict} capabilityNames={capabilityNames} />
            </li>
          ))}
        </ul>
      )}
      <Link
        href={localizePath(locale, `/laboratorios/${lab.id}`)}
        className="mt-auto inline-flex items-center gap-1 rounded pt-1 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {dict.detail} <span aria-hidden="true">→</span>
      </Link>
    </li>
  );
}
