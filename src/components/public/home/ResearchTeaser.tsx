import Link from "next/link";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { LinkButton } from "@/components/ui/LinkButton";
import { CAPABILITY_IDS, labsWithCapability } from "@/content/capabilities";
import { LABS } from "@/content/labs";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Pesquisa e empresas na Home (DESIGN-D): as capacidades com mais laboratórios que as descrevem no
 * portfólio (nível "offered"; potencial e pendente não contam) levam a Laboratórios filtrado e a Para
 * empresas. Só em PT, como as páginas de destino; mesma quarentena da página Para empresas.
 */
export function ResearchTeaser({ locale, dict, capabilityNames }: { locale: Locale; dict: Dictionary["home"]["research"]; capabilityNames: Dictionary["capabilities"] }) {
  const top = CAPABILITY_IDS.map((id) => ({ id, count: labsWithCapability(id).filter((x) => x.level === "offered").length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const labs = localizePath(locale, "/laboratorios");

  return (
    <UnverifiedContent section="empresas.capacidades">
      <section className="section-regular bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
          <div data-reveal className="flex flex-col gap-5 lg:col-span-5">
            <p className="eyebrow">
              <span aria-hidden="true" className="rail-mark h-0.5 w-6 rounded-full bg-action" />
              {dict.eyebrow}
            </p>
            <h2 className="t-section font-black">{dict.title}</h2>
            <p className="t-lead text-fg-muted">{dict.description.replace("{count}", String(LABS.length))}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <LinkButton href={localizePath(locale, "/para-empresas")}>{dict.companies}</LinkButton>
              <Link href={labs} className="inline-flex min-h-11 items-center gap-1 rounded font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {dict.labs} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <ul className="grid content-start gap-x-8 sm:grid-cols-2 lg:col-span-7" data-reveal-group>
            {top.map((c) => (
              <li key={c.id}>
                <Link
                  href={`${labs}?capacidade=${c.id}`}
                  className="group flex items-baseline justify-between gap-4 border-b border-line py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="f-display text-xl font-black group-hover:text-link">{capabilityNames[c.id]}</span>
                  <span className="meta shrink-0">
                    {c.count === 1 ? dict.labsPerCapabilityOne : dict.labsPerCapability.replace("{count}", String(c.count))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </UnverifiedContent>
  );
}
