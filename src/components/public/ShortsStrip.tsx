"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { SectionHeading } from "@/components/public/SectionHeading";
import type { ShortVideo } from "@/lib/content/videos";

export interface ShortsLabels {
  eyebrow: string;
  title: string;
  description: string;
  play: string;
  watch: string;
  shuffle: string;
  privacy: string;
  untitled: string;
}

/** Embaralhamento de Fisher-Yates com gerador determinístico (mulberry32) a partir de uma semente. */
function shuffle<T>(list: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const noop = () => () => {};
/** true só depois da hidratação: o HTML do servidor (esqueleto) é igual para todos. */
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/**
 * Faixa de Shorts do curso: sorteia `count` vídeos a cada visita (no cliente,
 * porque as páginas são estáticas/ISR) e só carrega o player do YouTube quando
 * o visitante clica (fachada com miniatura: sem cookies nem scripts de terceiros
 * antes do consentimento implícito do clique). Sem JS, mostra o esqueleto.
 */
export function ShortsStrip({ videos, count = 3, labels, tone = "surface" }: { videos: ShortVideo[]; count?: number; labels: ShortsLabels; tone?: "surface" | "canvas" }) {
  const hydrated = useHydrated();
  // Semente sorteada no cliente; só é usada depois da hidratação (sem mismatch).
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [playing, setPlaying] = useState<string | null>(null);
  const picked = useMemo(() => (hydrated ? shuffle(videos, seed).slice(0, count) : null), [hydrated, videos, seed, count]);
  const draw = () => {
    setPlaying(null);
    setSeed(Math.floor(Math.random() * 0xffffffff));
  };

  if (videos.length === 0) return null;
  const cols = count >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";
  return (
    <section className={tone === "canvas" ? "bg-canvas" : "bg-surface"} data-shorts>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow={labels.eyebrow} title={labels.title} description={labels.description} />
        <ul className={`mt-10 grid gap-5 ${cols}`} aria-busy={picked === null} data-reveal-group>
          {(picked ?? Array.from({ length: count }, () => null)).map((v, i) => (
            <li key={v?.id ?? `skeleton-${i}`} className="card-lift relative overflow-hidden rounded-2xl border border-line bg-canvas">
              <div className="relative aspect-[9/16] w-full bg-surface-2">
                {v && playing === v.id ? (
                  <iframe
                    src={v.embed}
                    title={v.title || labels.untitled}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 h-full w-full"
                  />
                ) : v ? (
                  <button
                    type="button"
                    onClick={() => setPlaying(v.id)}
                    aria-label={`${labels.play}: ${v.title || labels.untitled}`}
                    className="zoom-media group absolute inset-0 block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura pública do YouTube, sem otimização externa */}
                    <img
                      src={v.thumb}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        if (e.currentTarget.src !== v.thumbFallback) e.currentTarget.src = v.thumbFallback;
                      }}
                      className="h-full w-full object-cover"
                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-action text-fg-on-action shadow-lg transition-transform group-hover:scale-110">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 size-7">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-bold leading-snug text-white">{v.title || labels.untitled}</span>
                  </button>
                ) : (
                  <span className="absolute inset-0 animate-pulse bg-surface-2" />
                )}
              </div>
              {v && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-fg-muted">
                  <span className="truncate">{v.author}</span>
                  <a href={v.url} target="_blank" rel="noopener" className="shrink-0 rounded font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    {labels.watch} ↗
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-fg-muted">{labels.privacy}</p>
          {videos.length > count && (
            <button type="button" onClick={draw} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-bold text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              <span aria-hidden="true">⟳</span> {labels.shuffle}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
