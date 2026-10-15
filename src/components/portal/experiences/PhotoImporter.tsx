"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ImportItemResult } from "@/lib/files/import";
import { importExperiencePhotos, type PhotoImportState } from "@/lib/portal/actions/experiences";

type Dict = Dictionary["portal"];

/**
 * Importa a pasta de fotos da experiência em lotes (5 por chamada) até o fim, com progresso.
 * Idempotente: foto que já está no acervo é só religada. `autoStart` logo após criar a experiência.
 */
export function PhotoImporter({ dict, itemId, hasFolder, hasPhotos, autoStart }: { dict: Dict; itemId: string; hasFolder: boolean; hasPhotos: boolean; autoStart: boolean }) {
  const e = dict.experiences;
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [log, setLog] = useState<ImportItemResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancel = useRef(false);
  const started = useRef(false);
  // logo após criar, a autorização já foi confirmada no formulário
  const [authorized, setAuthorized] = useState(autoStart);

  async function run() {
    setRunning(true);
    setError(null);
    setLog([]);
    cancel.current = false;
    let cursor = 0;
    let prev: PhotoImportState = {};
    const all: ImportItemResult[] = [];
    try {
      while (!cancel.current) {
        const fd = new FormData();
        fd.set("id", itemId);
        fd.set("cursor", String(cursor));
        if (authorized) fd.set("authorized", "1");
        const state = await importExperiencePhotos(prev, fd);
        prev = state;
        if (state.error) {
          setError(state.error.startsWith("db:") ? state.error.slice(3) : (dict.errors as Record<string, string>)[state.error] ?? dict.errors.server);
          break;
        }
        const r = state.result!;
        all.push(...r.items);
        setLog([...all]);
        setProgress({ done: r.next ?? r.total, total: r.total });
        if (r.next === null) break;
        cursor = r.next;
      }
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  useEffect(() => {
    if (autoStart && hasFolder && !started.current) {
      started.current = true;
      // a URL perde o ?importar=1 para um F5 não importar de novo
      window.history.replaceState(null, "", window.location.pathname);
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasFolder) return <p className="text-sm text-fg-muted">{e.noFolder}</p>;
  const counts = { imported: 0, skipped: 0, ignored: 0, error: 0 };
  for (const i of log ?? []) counts[i.status] += 1;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={authorized} onChange={(ev) => setAuthorized(ev.target.checked)} disabled={running} className="mt-0.5 size-5 shrink-0" />
        <span>
          {e.authorized} <span className="text-fg-muted">{e.authorizedImportHelp}</span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant={hasPhotos ? "secondary" : "primary"} loading={running} onClick={() => void run()} disabled={running}>
          {hasPhotos ? e.importMore : e.importStart}
        </Button>
        {running && (
          <Button type="button" variant="ghost" size="sm" onClick={() => (cancel.current = true)}>
            {e.cancelImport}
          </Button>
        )}
      </div>
      {progress && (
        <div role="status" aria-live="polite" className="flex flex-col gap-2 text-sm">
          <progress max={progress.total || 1} value={progress.done} className="h-2 w-full max-w-md accent-action" />
          <p>
            {running
              ? e.importing.replace("{done}", String(progress.done)).replace("{total}", String(progress.total))
              : e.importDone.replace("{imported}", String(counts.imported)).replace("{skipped}", String(counts.skipped)).replace("{ignored}", String(counts.ignored))}
          </p>
          {!running && counts.error > 0 && <p className="font-bold text-danger">{e.importErrors.replace("{count}", String(counts.error))}</p>}
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
