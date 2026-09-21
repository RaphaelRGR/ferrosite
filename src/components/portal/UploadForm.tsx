"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Field";
import type { Dictionary } from "@/i18n/dictionaries";
import { PROJECT_AREAS, TOP_AREAS } from "@/lib/files/drive-folders";
import { CLASSIFICATIONS } from "@/lib/portal/authz";
import { CONSENT_STATUSES } from "@/lib/portal/content-constants";

type Dict = Dictionary["portal"];

/**
 * Enviar arquivo ao Drive institucional (DRIVE-003). O navegador envia o
 * arquivo ao servidor do Portal (`/portal/arquivos/upload`), nunca ao Google;
 * o servidor valida tipo/permissão/pasta e responde só com id e caminho.
 */
export function UploadForm({
  dict,
  projects,
  overseer,
  initialProject,
  missionId,
  canWrite,
  accept,
}: {
  dict: Dict;
  projects: Array<{ slug: string; name: string }>;
  overseer: boolean;
  initialProject?: string;
  missionId?: string;
  canWrite: boolean;
  /** Extensões aceitas (da allowlist `uploadable`). */
  accept: string[];
}) {
  const u = dict.files.upload;
  const router = useRouter();
  const fileId = useId();
  const [target, setTarget] = useState<"project" | "area">(initialProject || !overseer ? "project" : "area");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ fileId: string; path: string; name: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError(u.errors.empty);
      return;
    }
    setPending(true);
    setProgress(0);
    try {
      const result = await new Promise<{ status: number; body: Record<string, string> }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/portal/arquivos/upload");
        xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
        xhr.onload = () => {
          let body: Record<string, string> = {};
          try {
            body = JSON.parse(xhr.responseText);
          } catch {
            body = {};
          }
          resolve({ status: xhr.status, body });
        };
        xhr.onerror = () => reject(new Error("network"));
        xhr.send(fd);
      });
      if (result.status === 201) {
        setDone({ fileId: result.body.fileId, path: result.body.path, name: result.body.name });
        form.reset();
        router.refresh();
      } else {
        const code = result.body.error ?? "server";
        const text = (u.errors as Record<string, string>)[code] ?? dict.errors.server;
        setError(code === "too_large" && result.body.detail ? `${text} (${Math.round(Number(result.body.detail) / 1024 / 1024)} MB)` : text);
      }
    } catch {
      setError(u.errors.network);
    } finally {
      setPending(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" encType="multipart/form-data">
      {!canWrite && (
        <p role="alert" className="rounded-lg border border-warning bg-surface px-4 py-3 text-sm font-bold text-warning">
          {u.noWriteScope}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fileId} className="text-sm font-bold text-fg">
          {u.file} <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input id={fileId} name="file" type="file" required accept={accept.map((e) => `.${e}`).join(",")} className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-base text-fg file:mr-3 file:rounded-full file:border-0 file:bg-action file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-fg-on-action" />
        <p className="text-xs text-fg-muted">{u.fileHelp.replace("{types}", accept.join(", "))}</p>
      </div>

      {overseer && (
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-2 text-sm font-bold text-fg">{u.destination}</legend>
          {(["project", "area"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="radio" name="target" value={k} checked={target === k} onChange={() => setTarget(k)} />
              {u.targets[k]}
            </label>
          ))}
        </fieldset>
      )}
      {!overseer && <input type="hidden" name="target" value="project" />}

      {target === "project" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {missionId ? (
            <>
              <input type="hidden" name="project_slug" value={initialProject} />
              <input type="hidden" name="mission_id" value={missionId} />
              <input type="hidden" name="area" value="missoes" />
              <p className="text-sm text-fg-muted sm:col-span-2">{u.missionTarget}</p>
            </>
          ) : (
            <>
              <Select label={u.project} name="project_slug" required defaultValue={initialProject ?? projects[0]?.slug ?? ""} options={projects.map((p) => ({ value: p.slug, label: p.name }))} />
              <Select label={u.area} name="area" defaultValue="documentos" options={PROJECT_AREAS.filter((a) => a !== "missoes").map((a) => ({ value: a, label: u.areas[a] }))} />
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={u.area} name="area" defaultValue="comunicacao" options={TOP_AREAS.map((a) => ({ value: a, label: u.areas[a] }))} />
          <Input label={u.sub} name="sub" maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" help={u.subHelp} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={dict.projects.classification} name="classification" defaultValue="internal" options={CLASSIFICATIONS.map((c) => ({ value: c, label: dict.classification[c] }))} />
        <Select label={dict.files.consent} name="consent" defaultValue="not_required" options={CONSENT_STATUSES.map((s) => ({ value: s, label: dict.files.consents[s] }))} />
        <Input label={dict.files.consentNote} name="consent_note" maxLength={500} help={dict.files.consentNoteHelp} />
        <Input label={dict.files.credit} name="credit" maxLength={200} />
        <Input label={dict.files.altText} name="alt_text" maxLength={300} />
        <Input label={dict.files.altTextEn} name="alt_text_en" maxLength={300} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending} disabled={!canWrite}>
          {u.submit}
        </Button>
        {progress !== null && (
          <span className="text-sm text-fg-muted" aria-live="polite">
            {progress < 100 ? `${progress}%` : u.finishing}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-lg border border-success bg-surface px-4 py-3 text-sm">
          <span className="font-bold text-success">{u.done}</span>{" "}
          <a href={`/portal/arquivos/${done.fileId}`} className="underline underline-offset-4">{done.name}</a> · <code className="font-mono text-xs">{done.path}</code>
        </p>
      )}
    </form>
  );
}
