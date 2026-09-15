import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentForm, ContentTransitions, RollbackForm } from "@/components/portal/ContentForms";
import { CONTENT_STATUS_TONE } from "@/components/portal/content-tones";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { localizePath, type Locale } from "@/i18n/config";
import { renderMarkdown } from "@/lib/content/markdown";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { CONTENT_TYPE_PUBLIC_PATH, getContent, listApprovals, listFiles, listProjectOptions, listPublications, listRevisions } from "@/lib/portal/content";

export const metadata: Metadata = { title: "Conteúdo" };

const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-fg-muted";

/**
 * Conteúdo (18): edição (versão), fluxo de aprovação (autor não aprova), publicação
 * como snapshot, revisões com rollback, pedidos de aprovação, publicações e preview
 * por token. `?editar=1` mostra o formulário.
 */
export default async function ContentPage({ params, searchParams }: PageProps<"/portal/conteudos/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  const item = await getContent(id);
  if (!item) notFound();
  const [revisions, approvals, publications, projects, files] = await Promise.all([listRevisions(id), listApprovals(id), listPublications(id), listProjectOptions(), listFiles()]);
  const c = dict.content;
  const overseer = isOverseer(profile.global_role);
  const canEdit = overseer || (item.author_id === profile.id && ["draft", "changes_requested", "review"].includes(item.status));
  const editing = sp.editar === "1" && canEdit;
  const fmt = (iso: string) => formatDate("pt", new Date(iso), { dateStyle: "short", timeStyle: "short" });
  const live = publications.find((p) => !p.unpublished_at);
  const publicPath = CONTENT_TYPE_PUBLIC_PATH[item.type];
  const previewHref = localizePath(item.locale as Locale, `/previa/${item.preview_token}`);
  const publishedRevisionIds = new Set(publications.map((p) => p.revision_id));

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/conteudos" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {c.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black">{item.title}</h1>
          <Badge tone={CONTENT_STATUS_TONE[item.status]}>{c.statuses[item.status]}</Badge>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {c.types[item.type]} · {item.locale.toUpperCase()} · /{item.slug} · {c.author}: {item.author?.full_name || item.author?.email} · {dict.projects.version} {item.version}
        </p>
      </header>

      {editing ? (
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-6">
          <h2 className="mb-5 text-lg font-bold">{c.editTitle}</h2>
          <ContentForm dict={dict} item={item} projects={projects} files={files.map((f) => ({ id: f.id, label: `${f.name} (${dict.files.consents[f.consent]})` }))} cancelHref={`/portal/conteudos/${id}`} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-8">
            <section className="rounded-xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">{c.body}</h2>
                <div className="flex flex-wrap gap-2">
                  {canEdit && (
                    <LinkButton href={`/portal/conteudos/${id}?editar=1`} variant="secondary" size="sm">
                      {dict.common.edit}
                    </LinkButton>
                  )}
                  <LinkButton href={previewHref} variant="secondary" size="sm" target="_blank" rel="noopener" title={c.previewHelp}>
                    {c.preview}
                  </LinkButton>
                  {live && publicPath && (
                    <LinkButton href={localizePath(item.locale as Locale, `${publicPath}/${live.slug}`)} variant="secondary" size="sm" target="_blank" rel="noopener">
                      {c.publicLink}
                    </LinkButton>
                  )}
                </div>
              </div>
              {item.summary && <p className="mt-3 text-sm text-fg-muted">{item.summary}</p>}
              <div className="prose-content mt-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body_md) }} />
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                {item.event_at && (
                  <div>
                    <dt className={H2}>{c.eventAt}</dt>
                    <dd className="mt-1">
                      {fmt(item.event_at)} {item.event_place && `· ${item.event_place}`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className={H2}>{c.sourceNote}</dt>
                  <dd className="mt-1">{item.source_note || dict.common.none}</dd>
                </div>
                <div>
                  <dt className={H2}>{c.project}</dt>
                  <dd className="mt-1">{item.project ? <Link href={`/portal/projetos/${item.project.slug}`} className="text-link underline-offset-4 hover:underline">{item.project.name}</Link> : dict.common.none}</dd>
                </div>
                <div>
                  <dt className={H2}>{c.consentConfirmed}</dt>
                  <dd className="mt-1">{item.consent_confirmed ? dict.crm.yes : dict.crm.no}</dd>
                </div>
              </dl>
              {!publicPath && <p className="mt-4 text-xs text-fg-muted">{c.notPublicType}</p>}
            </section>

            <section className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-lg font-bold">{c.revisions}</h2>
              <ol className="mt-3 flex flex-col gap-2 text-sm">
                {revisions.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                    <span>
                      <span className="font-bold">{c.revision.replace("{n}", String(r.revision_no))}</span> · {(r.snapshot as { title?: string }).title} · {r.author?.full_name || r.author?.email} · {fmt(r.created_at)}
                      {live?.revision_id === r.id && (
                        <>
                          {" "}
                          <Badge tone="success">{c.statuses.published}</Badge>
                        </>
                      )}
                    </span>
                    {overseer && publishedRevisionIds.has(r.id) && live?.revision_id !== r.id && <RollbackForm dict={dict} itemId={item.id} revision={r} />}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{c.transitions}</h2>
              <p className="mt-1 text-xs text-fg-muted">{c.transitionsHelp}</p>
              <div className="mt-3">
                <ContentTransitions dict={dict} item={item} canApprove={overseer} />
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{c.approvals}</h2>
              {approvals.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{c.noApprovals}</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {approvals.map((a) => (
                    <li key={a.id} className="border-l-2 border-line pl-3">
                      <p>
                        <Badge tone={a.decision === "approved" ? "success" : a.decision === "changes_requested" ? "warning" : "neutral"}>{c.decisions[a.decision]}</Badge>
                      </p>
                      <p className="mt-1 text-xs text-fg-muted">
                        {a.requester?.full_name || a.requester?.email} · {fmt(a.created_at)}
                        {a.reviewer && ` → ${a.reviewer.full_name || a.reviewer.email}`}
                        {a.decided_at && ` · ${fmt(a.decided_at)}`}
                      </p>
                      {a.comment && <p className="mt-1 whitespace-pre-line">{a.comment}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{c.publications}</h2>
              {publications.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{c.noPublications}</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {publications.map((p) => (
                    <li key={p.id} className="border-l-2 border-line pl-3">
                      <p className="font-bold">{p.title}</p>
                      <p className="text-xs text-fg-muted">
                        {p.unpublished_at ? `${c.unpublishedAt} ${fmt(p.unpublished_at)}` : `${c.livePublication} ${fmt(p.published_at)}`}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
