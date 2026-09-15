import type { Metadata } from "next";
import Link from "next/link";
import { CONTENT_STATUS_TONE } from "@/components/portal/content-tones";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { requireActiveProfile } from "@/lib/portal/context";
import { CONTENT_STATUSES, CONTENT_TYPES, listContent, type ContentStatus, type ContentType } from "@/lib/portal/content";

export const metadata: Metadata = { title: "Conteúdos" };

/** Conteúdos editoriais (18): lista por situação/tipo (estado de URL). Autores veem os seus; overseers tudo (RLS). */
export default async function ContentListPage({ searchParams }: PageProps<"/portal/conteudos">) {
  const dict = getDictionary("pt").portal;
  await requireActiveProfile();
  const sp = await searchParams;
  const status = (CONTENT_STATUSES as string[]).includes(String(sp.situacao)) ? (sp.situacao as ContentStatus) : "all";
  const type = (CONTENT_TYPES as string[]).includes(String(sp.tipo)) ? (sp.tipo as ContentType) : "all";
  const items = await listContent({ status, type });
  const c = dict.content;
  const href = (s: string, t: string) => `/portal/conteudos${s !== "all" || t !== "all" ? `?${[s !== "all" && `situacao=${s}`, t !== "all" && `tipo=${t}`].filter(Boolean).join("&")}` : ""}`;
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface text-fg hover:bg-surface-2"}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{c.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">{c.description}</p>
        </div>
        <LinkButton href="/portal/conteudos/novo">{c.new}</LinkButton>
      </header>
      <nav aria-label={c.filterStatus} className="flex flex-wrap gap-2">
        <Link href={href("all", type)} aria-current={status === "all" ? "page" : undefined} className={chip(status === "all")}>
          {c.all}
        </Link>
        {CONTENT_STATUSES.map((s) => (
          <Link key={s} href={href(s, type)} aria-current={status === s ? "page" : undefined} className={chip(status === s)}>
            {c.statuses[s]}
          </Link>
        ))}
      </nav>
      <nav aria-label={c.filterType} className="flex flex-wrap gap-2">
        <Link href={href(status, "all")} aria-current={type === "all" ? "page" : undefined} className={chip(type === "all")}>
          {c.all}
        </Link>
        {CONTENT_TYPES.map((t) => (
          <Link key={t} href={href(status, t)} aria-current={type === t ? "page" : undefined} className={chip(type === t)}>
            {c.types[t]}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <EmptyState title={c.empty} description="" />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((x) => (
            <li key={x.id}>
              <Link href={`/portal/conteudos/${x.id}`} className="flex flex-col gap-1 p-4 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-widest text-fg-muted">
                    {c.types[x.type]} · {x.locale.toUpperCase()} · /{x.slug}
                  </span>
                  <span className="block font-bold">{x.title}</span>
                  <span className="block text-sm text-fg-muted">
                    {x.author?.full_name || x.author?.email} · {formatDate("pt", new Date(x.updated_at), { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </span>
                <Badge tone={CONTENT_STATUS_TONE[x.status]}>{c.statuses[x.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
