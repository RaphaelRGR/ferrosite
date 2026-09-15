import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listOrganizations, PARTNERSHIP_STAGES, type PartnershipStage } from "@/lib/portal/crm";

export const metadata: Metadata = { title: "Empresas" };

/** Organizações (13): lista por etapa do pipeline (estado de URL). Só coordenação/administração. */
export default async function OrganizationsPage({ searchParams }: PageProps<"/portal/empresas">) {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const sp = await searchParams;
  const stage = (PARTNERSHIP_STAGES as string[]).includes(String(sp.etapa)) ? (sp.etapa as PartnershipStage) : "all";
  const items = await listOrganizations(stage);
  const c = dict.crm;
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface text-fg hover:bg-surface-2"}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{c.organizations}</h1>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">{c.organizationsDescription}</p>
        </div>
        <LinkButton href="/portal/empresas/nova">{c.newOrganization}</LinkButton>
      </header>
      <nav aria-label={c.filterStage} className="flex flex-wrap gap-2">
        <Link href="/portal/empresas" aria-current={stage === "all" ? "page" : undefined} className={chip(stage === "all")}>
          {c.allStages}
        </Link>
        {PARTNERSHIP_STAGES.map((s) => (
          <Link key={s} href={`/portal/empresas?etapa=${s}`} aria-current={stage === s ? "page" : undefined} className={chip(stage === s)}>
            {c.stages[s]}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-fg-muted" aria-live="polite">
        {c.results.replace("{count}", String(items.length))}
      </p>
      {items.length === 0 ? (
        <EmptyState title={c.emptyOrganizations} description="" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((o) => (
            <li key={o.id}>
              <Link href={`/portal/empresas/${o.id}`} className="flex h-full flex-col gap-2 rounded-xl border border-line bg-surface p-5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={o.stage === "confirmed" ? "success" : o.stage === "lost" ? "danger" : o.stage === "paused" ? "warning" : "neutral"}>{c.stages[o.stage]}</Badge>
                  <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{c.kinds[o.kind]}</span>
                  {o.public_partner && <Badge tone="info">{c.publicPartner}</Badge>}
                </div>
                <p className="text-lg font-bold leading-snug">{o.name}</p>
                <p className="text-sm text-fg-muted">{[o.sector, o.city, o.state].filter(Boolean).join(" · ") || dict.common.none}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
