"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { setExperienceCover, setExperiencePhotoAlt, toggleExperiencePhoto } from "@/lib/portal/actions/experiences";
import type { ExperiencePhoto } from "@/lib/portal/queries/experiences";

type Dict = Dictionary["portal"];

/**
 * Grade de fotos da experiência (EXP-001): capa, mostrar/ocultar e descrição. As mudanças valem no
 * site depois de "Atualizar no site" (o banco volta o item a rascunho até lá).
 */
export function PhotoGrid({ dict, itemId, photos, coverId }: { dict: Dict; itemId: string; photos: ExperiencePhoto[]; coverId: string | null }) {
  const e = dict.experiences;
  if (photos.length === 0) return <p className="text-sm text-fg-muted">{e.noPhotos}</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((p) => (
        <PhotoCard key={p.fileId} dict={dict} itemId={itemId} photo={p} isCover={p.fileId === coverId} />
      ))}
    </ul>
  );
}

function PhotoCard({ dict, itemId, photo, isCover }: { dict: Dict; itemId: string; photo: ExperiencePhoto; isCover: boolean }) {
  const e = dict.experiences;
  const [coverState, coverAction, coverPending] = useActionState(setExperienceCover, IDLE);
  const [showState, showAction, showPending] = useActionState(toggleExperiencePhoto, IDLE);
  const [altState, altAction, altPending] = useActionState(setExperiencePhotoAlt, IDLE);
  const error = [coverState, showState, altState].find((s) => s.error)?.error;

  return (
    <li className={`flex flex-col overflow-hidden rounded-xl border bg-surface ${isCover ? "border-action" : "border-line"} ${photo.shown ? "" : "opacity-70"}`} data-photo={photo.fileId}>
      <div className="relative aspect-[4/3] bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- proxy autenticado do Portal */}
        <img src={`/portal/arquivos/${photo.fileId}/miniatura`} alt={photo.alt} className="size-full object-cover" loading="lazy" />
        <div className="absolute left-2 top-2 flex gap-2">
          {isCover && <span className="rounded-full bg-action px-3 py-1 text-xs font-bold text-fg-on-action">★ {e.cover}</span>}
          {!photo.shown && <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-fg">{e.hidden}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <form action={altAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="file_id" value={photo.fileId} />
          <label className="flex flex-col gap-1 text-xs font-bold">
            {e.altLabel}
            <textarea name="alt" defaultValue={photo.alt} maxLength={300} rows={2} className="rounded-lg border border-line-strong bg-surface px-2 py-1.5 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          </label>
          <Button type="submit" variant="ghost" size="sm" loading={altPending} className="self-start">
            {e.saveAlt}
          </Button>
        </form>
        <div className="mt-auto flex flex-wrap gap-2">
          {!isCover && photo.shown && (
            <form action={coverAction}>
              <input type="hidden" name="id" value={itemId} />
              <input type="hidden" name="file_id" value={photo.fileId} />
              <Button type="submit" variant="secondary" size="sm" loading={coverPending}>
                ★ {e.makeCover}
              </Button>
            </form>
          )}
          {!isCover && (
            <form action={showAction}>
              <input type="hidden" name="id" value={itemId} />
              <input type="hidden" name="file_id" value={photo.fileId} />
              <input type="hidden" name="show" value={photo.shown ? "0" : "1"} />
              <Button type="submit" variant="ghost" size="sm" loading={showPending}>
                {photo.shown ? e.hide : e.show}
              </Button>
            </form>
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs font-bold text-danger">
            {error.startsWith("db:") ? error.slice(3) : (dict.errors as Record<string, string>)[error] ?? dict.errors.server}
          </p>
        )}
      </div>
    </li>
  );
}
