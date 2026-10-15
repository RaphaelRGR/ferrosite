import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listExperiences } from "@/lib/portal/queries/experiences";

export const metadata: Metadata = { title: "Experiências" };

/**
 * Experiências (EXP-001): visitas, palestras e atividades do site, criadas e publicadas pela
 * administração/coordenação sem passar pelo fluxo de revisão de Conteúdos.
 */
export default async function ExperiencesPage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const e = dict.experiences;
  const items = await listExperiences();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{e.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{e.intro}</p>
        </div>
        <LinkButton href="/portal/experiencias/nova">{e.new}</LinkButton>
      </div>

      {items.length === 0 ? (
        <EmptyState title={e.empty} description="" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((x) => (
            <li key={x.id}>
              <Link href={`/portal/experiencias/${x.id}`} className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <div className="aspect-[16/9] bg-surface-2">
                  {x.cover_file_id && (
                    // eslint-disable-next-line @next/next/no-img-element -- proxy autenticado do Portal
                    <img src={`/portal/arquivos/${x.cover_file_id}/miniatura?w=480`} alt="" className="size-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="flex flex-1 flex-col items-start gap-2 p-4">
                  <Badge tone={x.site === "live" ? "success" : x.site === "live_pending" ? "warning" : "neutral"}>{x.site === "live" ? e.onSite : x.site === "live_pending" ? e.onSitePending : e.draft}</Badge>
                  <p className="font-bold leading-snug">{x.title}</p>
                  <p className="mt-auto text-xs text-fg-muted">
                    {x.event_at ? formatDate("pt", new Date(x.event_at), { dateStyle: "long" }) : ""}
                    {x.event_place ? ` · ${x.event_place}` : ""} · {e.photosCount.replace("{count}", String(x.photos))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-fg-muted">
        {e.otherContent}{" "}
        <Link href="/portal/conteudos" className="rounded underline underline-offset-4 hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.nav.content}
        </Link>
      </p>
    </div>
  );
}
