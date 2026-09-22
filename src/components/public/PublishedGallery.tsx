import type { PublicGalleryItem } from "@/lib/content/public";

/**
 * Galeria de uma publicação (DRIVE-004): só recebe o que o banco já filtrou
 * (verificado, público, com consentimento). Imagens pelo proxy próprio
 * (`/api/midia`), `alt` obrigatório do acervo, crédito quando houver; sem JS.
 */
export function PublishedGallery({ items, title, creditLabel }: { items: PublicGalleryItem[]; title: string; creditLabel: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="galeria-title" className="mt-10">
      <h2 id="galeria-title" className="text-xs font-bold uppercase tracking-[0.2em] text-action">
        {title}
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" data-gallery-count={items.length}>
        {items.map((g) => (
          <li key={g.fileId} className="overflow-hidden rounded-xl border border-line bg-surface">
            <a href={g.url} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" target="_blank" rel="noopener">
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
    </section>
  );
}
