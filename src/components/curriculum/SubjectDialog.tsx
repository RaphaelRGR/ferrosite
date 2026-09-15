"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Subject } from "@/data/curriculums";
import type { CurriculumGraph } from "@/lib/curriculum/graph";
import type { Dictionary } from "@/i18n/dictionaries";

type Labels = Dictionary["flowchart"];

/**
 * Painel de detalhes da disciplina (09): ementa oficial, carga, categoria,
 * extensão, pré-requisitos (com alternativas), dependentes e equivalências.
 * Cada código relacionado é um botão que troca a seleção.
 */
export function SubjectDialog({
  subject,
  graph,
  labels,
  onClose,
  onSelect,
}: {
  subject: Subject | null;
  graph: CurriculumGraph;
  labels: Labels;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const chips = (ids: string[]) =>
    ids.length === 0 ? (
      <p className="text-sm text-fg-muted">{labels.none}</p>
    ) : (
      <ul className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const s = graph.byId.get(id);
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                title={s?.name}
                className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-left text-sm hover:border-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <span className="font-mono text-xs text-fg-muted">{id}</span> {s?.shortName ?? ""}
              </button>
            </li>
          );
        })}
      </ul>
    );

  return (
    <Dialog open={!!subject} onClose={onClose} title={subject?.name ?? ""} className="pt-4">
      {subject && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="rounded bg-surface-2 px-2 py-1 font-mono text-xs font-bold text-fg-muted">{subject.id}</span>
            <Badge tone="info">{labels.categories[subject.cat]}</Badge>
            {subject.ext && <Badge tone="warning">{labels.extension}</Badge>}
            <span className="ml-auto text-sm font-bold">
              {subject.hours} {labels.hours}
              {subject.classesPerWeek ? ` · ${subject.classesPerWeek}/sem` : ""}
            </span>
          </div>

          <section className="mb-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-muted">{labels.syllabus}</h3>
            <p className="text-sm leading-relaxed">{subject.syllabus || labels.noSyllabus}</p>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-muted">{labels.prerequisites}</h3>
            {chips(subject.pre)}
            {subject.preAny.map((group) => (
              <p key={group.join("|")} className="mt-2 text-sm text-fg-muted">
                ({group.join(" / ")})
              </p>
            ))}
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-muted">{labels.dependents}</h3>
            {chips(graph.dependents.get(subject.id) ?? [])}
          </section>

          {subject.equivalents.length > 0 && (
            <section className="mb-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-muted">{labels.equivalents}</h3>
              <p className="font-mono text-sm text-fg-muted">{subject.equivalents.join(", ")}</p>
            </section>
          )}

          <div className="mt-6 flex justify-end border-t border-line pt-6">
            <Button variant="secondary" onClick={onClose}>
              {labels.close}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
