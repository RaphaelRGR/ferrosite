"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Field";
import type { Dictionary } from "@/i18n/dictionaries";
import { PROJECT_AREAS, TOP_AREAS } from "@/lib/files/drive-folders";
import type { ImportItemResult } from "@/lib/files/import";
import { CLASSIFICATIONS } from "@/lib/portal/authz";
import { importDriveFolderBatch, type ImportState } from "@/lib/portal/actions/drive";
import { CONSENT_STATUSES } from "@/lib/portal/content-constants";

type Dict = Dictionary["portal"];

/**
 * Importar pasta do Drive para o acervo (DRIVE-004): o navegador chama a
 * ação por lotes até `next === null`, mostrando o que foi copiado, pulado
 * (já existia) ou ignorado (tipo fora da allowlist). Pode ser cancelado entre lotes.
 */
export function ImportForm({ dict, projects, contents }: {
  dict: Dict;
  projects: Array<{ slug: string; name: string }>;
  contents: Array<{ id: string; label: string }>;
}) {
  const t = dict.files.importer;
  const u = dict.files.upload;
  const [target, setTarget] = useState<"project" | "area" | "content">(contents.length ? "content" : "area");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<ImportItemResult[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancel = useRef(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRunning(true);
    setLog([]);
    setError(null);
    cancel.current = false;
    let cursor = 0;
    let prev: ImportState = {};
    try {
      while (!cancel.current) {
        fd.set("cursor", String(cursor));
        const state = await importDriveFolderBatch(prev, fd);
        prev = state;
        if (state.error) {
          setError(state.error.startsWith("db:") ? state.error.slice(3) : (dict.errors as Record<string, string>)[state.error] ?? dict.errors.server);
          break;
        }
        const r = state.result!;
        setLog((l) => [...l, ...r.items]);
        const done = r.next ?? r.total;
        setProgress({ done, total: r.total });
        if (r.next === null) break;
        cursor = r.next;
      }
    } finally {
      setRunning(false);
    }
  }
  const counts = { imported: 0, skipped: 0, ignored: 0, error: 0 };
  for (const i of log) counts[i.status] += 1;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input label={t.source} name="source" required maxLength={512} help={t.sourceHelp} />
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-2 text-sm font-bold text-fg">{u.destination}</legend>
        {(["content", "project", "area"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="radio" name="target" value={k} checked={target === k} onChange={() => setTarget(k)} disabled={k === "content" && contents.length === 0} />
            {k === "content" ? t.targetContent : u.targets[k]}
          </label>
        ))}
      </fieldset>
      {target === "content" && <Select label={t.content} name="item_id" options={contents.map((c) => ({ value: c.id, label: c.label }))} />}
      {target === "project" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={u.project} name="project_slug" options={projects.map((p) => ({ value: p.slug, label: p.name }))} />
          <Select label={u.area} name="area" defaultValue="galeria" options={PROJECT_AREAS.filter((a) => a !== "missoes").map((a) => ({ value: a, label: u.areas[a] }))} />
        </div>
      )}
      {target === "area" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={u.area} name="area" defaultValue="visitas" options={TOP_AREAS.map((a) => ({ value: a, label: u.areas[a] }))} />
          <Input label={u.sub} name="sub" maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" help={u.subHelp} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label={dict.projects.classification} name="classification" defaultValue="internal" options={CLASSIFICATIONS.map((c) => ({ value: c, label: dict.classification[c] }))} />
        <Select label={dict.files.consent} name="consent" defaultValue="pending" options={CONSENT_STATUSES.map((s) => ({ value: s, label: dict.files.consents[s] }))} />
        <Input label={dict.files.credit} name="credit" maxLength={200} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={running}>{t.start}</Button>
        {running && (
          <Button type="button" variant="ghost" onClick={() => { cancel.current = true; }}>
            {t.cancel}
          </Button>
        )}
        {progress && (
          <span className="text-sm text-fg-muted" aria-live="polite">
            {t.progress.replace("{done}", String(progress.done)).replace("{total}", String(progress.total))}
          </span>
        )}
      </div>
      {error && <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">{error}</p>}
      {log.length > 0 && (
        <div role="status" className="rounded-lg border border-line bg-canvas p-4 text-sm">
          <p className="font-bold">{t.summary.replace("{imported}", String(counts.imported)).replace("{skipped}", String(counts.skipped)).replace("{ignored}", String(counts.ignored)).replace("{error}", String(counts.error))}</p>
          <ul className="mt-2 max-h-64 overflow-auto font-mono text-xs">
            {log.map((i, n) => (
              <li key={`${i.name}-${n}`} className={i.status === "error" ? "text-danger" : i.status === "imported" ? "text-success" : "text-fg-muted"}>
                {t.statuses[i.status]} · {i.name}{i.detail ? ` (${i.detail})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
