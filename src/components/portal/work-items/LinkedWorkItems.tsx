import type { Dictionary } from "@/i18n/dictionaries";
import type { QuickCreateData, WorkItemRow } from "@/lib/portal/queries/work-items";
import { QuickCreate } from "./QuickCreate";
import { WorkItemCard } from "./WorkItemCard";

/**
 * Ações ligadas a um projeto ou missão (ACT-003). As ações continuam privadas:
 * membros do projeto só veem as que são deles (RLS), então o bloco some para
 * quem não tem nada a ver. Admin/coordenação criam já com o vínculo preenchido.
 */
export function LinkedWorkItems({
  dict,
  items,
  scope,
  createOptions,
  defaults,
}: {
  dict: Dictionary["portal"];
  items: WorkItemRow[];
  scope: "project" | "mission";
  createOptions: QuickCreateData | null;
  defaults: { projectId?: string; missionId?: string };
}) {
  const l = dict.workItems.linkedList;
  if (items.length === 0 && !createOptions) return null;
  return (
    <section aria-labelledby={`acoes-${scope}`} className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 id={`acoes-${scope}`} className="text-base font-bold">
            {l.title} {items.length > 0 && <span className="tabular-nums text-fg-muted">({items.length})</span>}
          </h2>
          <p className="text-xs text-fg-muted">{scope === "project" ? l.projectHint : l.missionHint}</p>
        </div>
        {createOptions && <QuickCreate dict={dict} options={createOptions} defaults={defaults} triggerLabel={scope === "project" ? l.newInProject : l.newInMission} />}
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-fg-muted">{l.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {items.map((i) => (
            <WorkItemCard key={i.id} item={i} dict={dict} />
          ))}
        </ul>
      )}
    </section>
  );
}
