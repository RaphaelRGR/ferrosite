"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { Select } from "@/components/ui/Field";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { linkContentFile } from "@/lib/portal/actions/content";
import type { ContentFileRow } from "@/lib/portal/queries/content";
import { ActionFeedback } from "@/components/portal/ActionFeedback";

type Dict = Dictionary["portal"];

/**
 * Galeria de um conteúdo (DRIVE-004): vincular arquivos já registrados,
 * legendar/ordenar, desvincular e enviar novos direto para conteudos/<tipo>/<slug>.
 * O que vai ao site é decidido no banco (consentimento/classificação), não aqui.
 */
export function ContentGallery({ dict, itemId, files, candidates, canEdit, driveWrite }: {
  dict: Dict;
  itemId: string;
  files: ContentFileRow[];
  candidates: Array<{ id: string; label: string }>;
  canEdit: boolean;
  driveWrite: boolean;
}) {
  const g = dict.content.gallery;
  return (
    <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="gallery-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="gallery-title" className="text-lg font-bold">{g.title}</h2>
        {canEdit && driveWrite && <LinkButton href={`/portal/arquivos/enviar?conteudo=${itemId}`} variant="secondary">{dict.files.upload.title}</LinkButton>}
      </div>
      <p className="mt-1 text-sm text-fg-muted">{g.help}</p>
      {files.length === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">{g.empty}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {files.map((cf) => (
            <li key={cf.file_id} className="rounded-lg border border-line bg-canvas p-3 text-sm">
              {cf.file ? (
                <>
                  <div className="flex items-start gap-3">
                    {cf.file.mime_type.startsWith("image/") && (
                      // eslint-disable-next-line @next/next/no-img-element -- proxy autenticado
                      <img src={`/portal/arquivos/${cf.file.id}/miniatura`} alt="" className="size-20 shrink-0 rounded-md border border-line object-cover" loading="lazy" />
                    )}
                    <div className="min-w-0">
                      <a href={`/portal/arquivos/${cf.file.id}`} className="block truncate font-bold underline-offset-4 hover:underline">{cf.file.name}</a>
                      <p className="text-xs text-fg-muted">
                        {dict.files.consents[cf.file.consent]} · {dict.classification[cf.file.classification]} · {dict.files.statuses[cf.file.status]}
                      </p>
                      <p className={`text-xs font-bold ${cf.file.consent !== "pending" && cf.file.consent !== "refused" && cf.file.classification === "public" && cf.file.status === "verified" ? "text-success" : "text-warning"}`}>
                        {cf.file.consent !== "pending" && cf.file.consent !== "refused" && cf.file.classification === "public" && cf.file.status === "verified" ? g.willPublish : g.wontPublish}
                      </p>
                    </div>
                  </div>
                  {canEdit && <CaptionForm dict={dict} itemId={itemId} fileId={cf.file_id} caption={cf.caption} position={cf.position} />}
                </>
              ) : (
                <span className="text-fg-muted">{dict.common.none}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && candidates.length > 0 && <LinkForm dict={dict} itemId={itemId} candidates={candidates} />}
    </section>
  );
}

function CaptionForm({ dict, itemId, fileId, caption, position }: { dict: Dict; itemId: string; fileId: string; caption: string; position: number }) {
  const [state, formAction, pending] = useActionState(linkContentFile, IDLE as ActionState);
  const g = dict.content.gallery;
  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="file_id" value={fileId} />
      <Input label={g.caption} name="caption" defaultValue={state.values?.caption ?? caption} maxLength={300} className="min-w-40 flex-1" />
      <Input label={g.position} name="position" type="number" min={0} defaultValue={state.values?.position ?? String(position)} className="w-24" />
      <Button type="submit" name="op" value="caption" variant="secondary" size="sm" loading={pending}>{dict.common.save}</Button>
      <Button type="submit" name="op" value="unlink" variant="ghost" size="sm" loading={pending}>{g.unlink}</Button>
      <div className="basis-full"><ActionFeedback state={state} dict={dict} /></div>
    </form>
  );
}

function LinkForm({ dict, itemId, candidates }: { dict: Dict; itemId: string; candidates: Array<{ id: string; label: string }> }) {
  const [state, formAction, pending] = useActionState(linkContentFile, IDLE as ActionState);
  const g = dict.content.gallery;
  return (
    <form action={formAction} className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-5">
      <input type="hidden" name="item_id" value={itemId} />
      <Select label={g.link} name="file_id" options={candidates.map((c) => ({ value: c.id, label: c.label }))} className="min-w-56 flex-1" />
      <Button type="submit" name="op" value="link" variant="secondary" loading={pending}>{g.linkAction}</Button>
      <div className="basis-full"><ActionFeedback state={state} dict={dict} /></div>
    </form>
  );
}
