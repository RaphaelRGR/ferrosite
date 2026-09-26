import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Timeline } from "@/components/portal/work-items/Timeline";
import { dueText, PRIORITY_TONE, STATUS_TONE, waitingText } from "@/components/portal/work-items/WorkItemCard";
import { WorkItemComment, WorkItemDecision, WorkItemEdit, WorkItemFileLink, WorkItemFileUnlink, WorkItemTransitions } from "@/components/portal/work-items/WorkItemForms";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { getWorkItem, getWorkItemTimeline, listAssignablePeople, listFileCandidates, listLinkOptions, listWorkItemFiles, personName } from "@/lib/portal/queries/work-items";
import { availableTransitions, canDecide, isOverdue } from "@/lib/portal/work-items";

export const metadata: Metadata = { title: "Ação" };

const card = "rounded-xl border border-line bg-surface p-5 sm:p-6";

/**
 * Uma ação (ACT-001): o essencial no topo (situação, dono, prazo, quem aprova,
 * quem é aguardado), botões do próximo passo, arquivos e a linha do tempo
 * (histórico automático + comentários). Quem não é admin/coordenação só chega
 * aqui pelos itens em que é responsável ou aprovador (RLS).
 */
export default async function WorkItemPage({ params }: PageProps<"/portal/acoes/[id]">) {
  const { id } = await params;
  const dict = getDictionary("pt").portal;
  const w = dict.workItems;
  const { profile, userId } = await requireActiveProfile();
  const item = await getWorkItem(id);
  if (!item) notFound();
  const overseer = isOverseer(profile.global_role);
  const actor = { id: userId, overseer };
  const [timeline, files, people, links, candidates] = await Promise.all([
    getWorkItemTimeline(id),
    listWorkItemFiles(id),
    overseer ? listAssignablePeople() : Promise.resolve([]),
    overseer ? listLinkOptions() : Promise.resolve({ projects: [], organizations: [] }),
    overseer ? listFileCandidates() : Promise.resolve([]),
  ]);
  const now = new Date();
  const transitions = availableTransitions(item, actor);
  const late = isOverdue(item, now);
  const folderId = files.find((f) => f.file?.drive_folder_id)?.file?.drive_folder_id;
  const fmt = (iso: string) => formatDate("pt", new Date(iso), { dateStyle: "short", timeStyle: "short" });

  const meta: Array<{ label: string; value: React.ReactNode }> = [
    { label: w.owner, value: item.owner ? personName(item.owner) : w.none },
    { label: w.due, value: item.due_at ? <span className={late ? "font-bold text-danger" : undefined}>{dueText(item.due_at, w, now)}</span> : w.noDue },
  ];
  if (item.approver) meta.push({ label: w.approver, value: personName(item.approver) });
  if (item.status === "waiting") meta.push({ label: w.waitingLabel, value: <span className="text-warning">{waitingText(item, dict, now)}</span> });
  if (item.project) meta.push({ label: w.project, value: <Link className="underline underline-offset-4" href={`/portal/projetos/${item.project.slug}`}>{item.project.name}</Link> });
  if (item.mission?.project) meta.push({ label: w.mission, value: <Link className="underline underline-offset-4" href={`/portal/projetos/${item.mission.project.slug}/missoes/${item.mission.id}`}>{item.mission.title}</Link> });
  if (item.organization) meta.push({ label: w.organization, value: overseer ? <Link className="underline underline-offset-4" href={`/portal/empresas/${item.organization.id}`}>{item.organization.name}</Link> : item.organization.name });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        {overseer && (
          <Link href="/portal/acoes" className="self-start text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {w.title}
          </Link>
        )}
        <h1 className="text-2xl font-black sm:text-3xl">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={STATUS_TONE[item.status]}>{w.statuses[item.status]}</Badge>
          {item.kind !== "action" && <Badge tone="neutral">{w.kinds[item.kind]}</Badge>}
          <Badge tone={PRIORITY_TONE[item.priority]}>{`${w.priority}: ${w.priorities[item.priority]}`}</Badge>
          {late && <Badge tone="danger">{w.overdue}</Badge>}
        </div>
      </header>

      {item.status === "awaiting_approval" && item.approver && (
        <p role="status" className={`rounded-lg border px-4 py-3 text-sm font-bold ${item.approver_id === userId ? "border-info bg-surface text-info" : "border-line bg-surface text-fg-muted"}`}>
          {item.approver_id === userId ? w.approvalForYou.replace("{name}", item.owner ? personName(item.owner) : w.system) : w.awaitingApprovalOf.replace("{name}", personName(item.approver))}
        </p>
      )}
      {item.decision_outcome && (
        <p className="rounded-lg border border-success bg-surface px-4 py-3 text-sm">
          <span className="font-bold">{w.decided.replace("{outcome}", item.decision_outcome)}</span>
          {item.decided_at && item.decider && <span className="block text-xs text-fg-muted">{w.decidedBy.replace("{name}", personName(item.decider)).replace("{date}", fmt(item.decided_at))}</span>}
        </p>
      )}
      {item.approved_at && item.status === "done" && (
        <p className="rounded-lg border border-success bg-surface px-4 py-3 text-sm font-bold text-success">{w.approvedBy.replace("{name}", item.approver ? personName(item.approver) : "").replace("{date}", fmt(item.approved_at))}</p>
      )}

      <WorkItemTransitions dict={dict} item={item} transitions={transitions} />
      {canDecide(item, actor) && <WorkItemDecision dict={dict} item={item} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {item.description && (
            <section className={card} aria-labelledby="descricao">
              <h2 id="descricao" className="text-base font-bold">{w.descriptionLabel}</h2>
              <p className="mt-2 whitespace-pre-line text-sm">{item.description}</p>
            </section>
          )}

          <section className={card} aria-labelledby="arquivos">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="arquivos" className="text-base font-bold">{w.files}</h2>
              <div className="flex flex-wrap gap-2">
                {folderId && (
                  <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-link underline underline-offset-4">
                    {w.openFolder} →
                  </a>
                )}
                {(overseer || item.owner_id === userId) && (
                  <LinkButton href={`/portal/arquivos/enviar?acao=${item.id}`} variant="secondary" size="sm">
                    {w.uploadFile}
                  </LinkButton>
                )}
              </div>
            </div>
            {files.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{w.filesEmpty}</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-line text-sm">
                {files.map((f) =>
                  f.file ? (
                    <li key={f.file_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="min-w-0">
                        <a href={`/portal/arquivos/${f.file.id}/original`} className="font-bold underline-offset-4 hover:underline">
                          {f.file.name}
                        </a>
                        <span className="block text-xs text-fg-muted">
                          {(f.file.name.split(".").pop() ?? "").toUpperCase()} · {w.updated.replace("{date}", formatDate("pt", new Date(f.file.updated_at), { dateStyle: "short" }))}
                        </span>
                      </span>
                      {overseer && <WorkItemFileUnlink dict={dict} itemId={item.id} fileId={f.file_id} />}
                    </li>
                  ) : null,
                )}
              </ul>
            )}
            {overseer && (
              <div className="mt-4">
                <WorkItemFileLink dict={dict} itemId={item.id} candidates={candidates.filter((c) => !files.some((f) => f.file_id === c.id))} />
              </div>
            )}
          </section>

          <section className={card} aria-labelledby="atividade">
            <h2 id="atividade" className="text-base font-bold">{w.activity}</h2>
            <div className="mt-4 flex flex-col gap-5">
              <Timeline entries={timeline} dict={dict} />
              <WorkItemComment dict={dict} itemId={item.id} />
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section className={card} aria-labelledby="dados">
            <h2 id="dados" className="sr-only">{w.linked}</h2>
            <dl className="flex flex-col gap-3 text-sm">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="text-xs font-bold uppercase tracking-widest text-fg-muted">{m.label}</dt>
                  <dd className="mt-0.5">{m.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {overseer && (
            <details className={card}>
              <summary className="cursor-pointer text-base font-bold">{w.edit}</summary>
              <p className="mt-2 text-xs text-fg-muted">{w.editHelp}</p>
              <div className="mt-4">
                <WorkItemEdit dict={dict} item={item} people={people.map((p) => ({ id: p.id, name: personName(p) }))} projects={links.projects} organizations={links.organizations} />
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
