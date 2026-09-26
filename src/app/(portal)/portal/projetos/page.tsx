import type { Metadata } from "next";
import Link from "next/link";
import { PROJECT_STATUS_TONE } from "@/components/portal/projects/ProjectHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { canCreateProject, PROJECT_STATUSES, type ProjectStatus } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listProjects } from "@/lib/portal/queries/projects";

export const metadata: Metadata = { title: "Projetos" };

/**
 * Lista de projetos visíveis (RLS decide). Busca, filtro de situação e
 * paginação são estado de URL; arquivados/cancelados só aparecem quando
 * filtrados (10). Cards responsivos (08).
 */
export default async function PortalProjectsPage({ searchParams }: PageProps<"/portal/projetos">) {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  const sp = await searchParams;
  const status = (PROJECT_STATUSES as string[]).includes(String(sp.situacao)) ? (sp.situacao as ProjectStatus) : "all";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  const { items, total, pages } = await listProjects({ status, q, page });
  const href = (over: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { situacao: status === "all" ? undefined : status, q: q || undefined, pagina: page > 1 ? page : undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
    const s = params.toString();
    return s ? `/portal/projetos?${s}` : "/portal/projetos";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">{dict.projects.title}</h1>
        {canCreateProject(profile.global_role) && <LinkButton href="/portal/projetos/novo">{dict.projects.new}</LinkButton>}
      </div>

      <form method="get" action="/portal/projetos" className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-bold">
            {dict.projects.search}
          </label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={80} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="situacao" className="text-sm font-bold">
            {dict.projects.filterStatus}
          </label>
          <select id="situacao" name="situacao" defaultValue={status} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <option value="all">{dict.projectStatus.all}</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {dict.projectStatus[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="min-h-11 rounded-full border border-line-strong bg-surface px-5 text-sm font-bold hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.projects.search}
        </button>
        <p className="w-full text-sm text-fg-muted sm:ml-auto sm:w-auto" aria-live="polite">
          {dict.projects.results.replace("{count}", String(total))}
        </p>
      </form>

      {items.length === 0 ? (
        <EmptyState title={q || status !== "all" ? dict.projects.emptyFiltered : dict.projects.emptyTitle} description={q || status !== "all" ? "" : dict.projects.emptyDescription} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/portal/projetos/${p.slug}`} className="flex h-full flex-col gap-2 rounded-xl border border-line bg-surface p-5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={PROJECT_STATUS_TONE[p.status]}>{dict.projectStatus[p.status]}</Badge>
                  <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{dict.projectCategory[p.category as keyof typeof dict.projectCategory]}</span>
                </div>
                <p className="text-lg font-bold leading-snug">{p.name}</p>
                {p.summary && <p className="line-clamp-3 text-sm text-fg-muted">{p.summary}</p>}
                <p className="mt-auto pt-2 text-xs text-fg-muted">
                  {dict.projects.updated} {formatDate("pt", new Date(p.updated_at), { dateStyle: "short" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={dict.projects.pagination.replace("{page}", String(page)).replace("{pages}", String(pages))} className="flex items-center justify-between gap-3">
          {page > 1 ? <LinkButton href={href({ pagina: page - 1 })} variant="secondary" size="sm">← {dict.common.previous}</LinkButton> : <span />}
          <span className="text-sm text-fg-muted">{dict.projects.pagination.replace("{page}", String(page)).replace("{pages}", String(pages))}</span>
          {page < pages ? <LinkButton href={href({ pagina: page + 1 })} variant="secondary" size="sm">{dict.common.next} →</LinkButton> : <span />}
        </nav>
      )}
    </div>
  );
}
