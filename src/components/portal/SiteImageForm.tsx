"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { setSiteImage } from "@/lib/portal/actions/site";
import { ActionFeedback } from "./ActionFeedback";

/**
 * Imagens institucionais do site (DRIVE-004b): a coordenação escolhe, por
 * posição, um arquivo do acervo já verificado, público e com consentimento.
 * O site só mostra o que o banco confirma (public_site_image).
 */
export function SiteImageForm({ dict, imageKey, current, candidates }: {
  dict: Dictionary["portal"];
  imageKey: string;
  current: string | null;
  candidates: Array<{ id: string; label: string }>;
}) {
  const [state, formAction, pending] = useActionState(setSiteImage, IDLE as ActionState);
  const s = dict.settings.siteImages;
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="key" value={imageKey} />
      <Select label={s.keys[imageKey as keyof typeof s.keys] ?? imageKey} name="file_id" defaultValue={current ?? ""} options={[{ value: "", label: dict.common.none }, ...candidates.map((c) => ({ value: c.id, label: c.label }))]} help={s.help} />
      {current && (
        // eslint-disable-next-line @next/next/no-img-element -- proxy autenticado
        <img src={`/portal/arquivos/${current}/miniatura`} alt="" className="max-h-40 w-fit rounded-lg border border-line" loading="lazy" />
      )}
      <div>
        <Button type="submit" variant="secondary" loading={pending}>{dict.common.save}</Button>
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}
