"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicGalleryItem } from "@/lib/content/public";

/**
 * Galeria de uma publicação (DRIVE-004): só recebe o que o banco já filtrou
 * (verificado, público, com consentimento). Imagens pelo proxy próprio
 * (`/api/midia`), `alt` obrigatório do acervo, crédito quando houver.
 * Clicar abre a foto inteira num <dialog> nativo (Esc/clique fora fecham,
 * setas navegam); sem JS o link abre a imagem na mesma aba.
 */
export function PublishedGallery({ items, title, creditLabel, labels }: { items: PublicGalleryItem[]; title: string; creditLabel: string; labels: { close: string; previous: string; next: string; counter: string } }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const count = items.length;

  const show = useCallback((i: number) => {
    setOpen(((i % count) + count) % count);
  }, [count]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") show(open + 1);
      if (e.key === "ArrowLeft") show(open - 1);
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, show]);

  if (count === 0) return null;
  const current = open !== null ? items[open] : null;
  return (
    <section aria-labelledby="galeria-title" className="mt-10">
      <h2 id="galeria-title" className="text-xs font-bold uppercase tracking-[0.2em] text-action">
        {title}
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" data-gallery-count={count} data-reveal-group>
        {items.map((g, i) => (
          <li key={g.fileId} className="card-lift overflow-hidden rounded-xl border border-line bg-surface">
            <a
              href={g.url}
              className="zoom-media block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                show(i);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia), sem otimização externa */}
              <img src={g.url} alt={g.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </a>
            {(g.caption || g.credit) && (
              <p className="px-3 py-2 text-xs text-fg-muted">
                {g.caption}
                {g.caption && g.credit && " · "}
                {g.credit && `${creditLabel}: ${g.credit}`}
              </p>
            )}
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(null);
        }}
        aria-label={title}
        className="m-auto max-h-[100dvh] max-w-[100vw] bg-transparent p-0 backdrop:bg-black/85 backdrop:backdrop-blur-sm"
      >
        {current && (
          <figure className="flex max-h-[100dvh] flex-col items-center gap-3 p-4 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia) */}
            <img src={current.url} alt={current.alt} className="max-h-[80dvh] max-w-[92vw] rounded-lg object-contain" />
            <figcaption className="max-w-[92vw] text-center text-sm text-white/85">
              {current.caption || current.alt}
              {current.credit && ` · ${creditLabel}: ${current.credit}`}
            </figcaption>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => show((open ?? 0) - 1)} aria-label={labels.previous} className="min-h-11 min-w-11 rounded-full border border-white/40 px-4 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                ←
              </button>
              <span className="text-xs text-white/80" aria-live="polite">
                {labels.counter.replace("{current}", String((open ?? 0) + 1)).replace("{total}", String(count))}
              </span>
              <button type="button" onClick={() => show((open ?? 0) + 1)} aria-label={labels.next} className="min-h-11 min-w-11 rounded-full border border-white/40 px-4 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                →
              </button>
              <button type="button" onClick={() => setOpen(null)} className="ml-2 min-h-11 rounded-full bg-white px-5 text-sm font-bold text-black hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                {labels.close}
              </button>
            </div>
          </figure>
        )}
      </dialog>
    </section>
  );
}
