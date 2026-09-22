"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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
 * Um Short do curso por vez: sorteado a cada visita (no cliente, porque as
 * páginas são estáticas/ISR), com "Outro vídeo" para avançar na ordem sorteada.
 * O player do YouTube só carrega quando o visitante clica (fachada com
 * miniatura: sem cookies nem scripts de terceiros antes disso). Sem JS, esqueleto.
 */
export function ShortsStrip({ videos, labels, tone = "surface" }: { videos: ShortVideo[]; labels: ShortsLabels; tone?: "surface" | "canvas" }) {
  const hydrated = useHydrated();
  // Semente sorteada no cliente; só é usada depois da hidratação (sem mismatch).
  const [seed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const order = useMemo(() => (hydrated ? shuffle(videos, seed) : []), [hydrated, videos, seed]);
  const video = order[index % Math.max(order.length, 1)] ?? null;
  const next = () => {
    setPlaying(false);
    setIndex((i) => i + 1);
  };

  if (videos.length === 0) return null;
  return (
    <section className={tone === "canvas" ? "bg-canvas" : "bg-surface"} data-shorts>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_minmax(260px,320px)] lg:gap-16">
        <div data-reveal>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-link">
            <span aria-hidden="true" className="rail-mark h-0.5 w-6 rounded-full bg-action" />
            {labels.eyebrow}
          </p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{labels.title}</h2>
          <p className="mt-3 max-w-xl text-fg-muted">{labels.description}</p>
          {video && (
            <p className="mt-6 text-lg font-bold leading-snug" aria-live="polite">
              {video.title || labels.untitled}
              {video.author && <span className="mt-1 block text-sm font-normal text-fg-muted">{video.author}</span>}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {videos.length > 1 && (
              <button type="button" onClick={next} disabled={!video} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-bold text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50">
                <span aria-hidden="true">⟳</span> {labels.shuffle}
              </button>
            )}
            {video && (
              <a href={video.url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {labels.watch} ↗
              </a>
            )}
          </div>
          <p className="mt-4 text-xs text-fg-muted">{labels.privacy}</p>
        </div>

        <div className="mx-auto w-full max-w-[320px] lg:mx-0" data-reveal>
          <div className="card-lift relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-line bg-surface-2 shadow-sm" aria-busy={!video}>
            {video && playing ? (
              <iframe
                src={video.embed}
                title={video.title || labels.untitled}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            ) : video ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`${labels.play}: ${video.title || labels.untitled}`}
                className="zoom-media group absolute inset-0 block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura pública do YouTube, sem otimização externa */}
                <img
                  key={video.id}
                  src={video.thumb}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.src !== video.thumbFallback) e.currentTarget.src = video.thumbFallback;
                  }}
                  className="h-full w-full object-cover"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-action text-fg-on-action shadow-lg transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 size-7">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            ) : (
              <span className="absolute inset-0 animate-pulse bg-surface-2" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
