/**
 * URLs da mídia pública (`/api/midia`). O site nunca pede o arquivo original
 * para exibir em lista ou grade: pede uma largura da lista permitida e o
 * servidor entrega a miniatura do Drive nesse tamanho. Só o lightbox usa a
 * maior largura. Larguras fora da lista voltam ao original (rota valida).
 */
export const MEDIA_WIDTHS = [240, 320, 480, 640, 960, 1280, 1600] as const;
export type MediaWidth = (typeof MEDIA_WIDTHS)[number];

/** URL de uma largura específica (sem `w`, é o arquivo original). */
export function mediaUrl(fileId: string, width?: MediaWidth): string {
  return width ? `/api/midia/${fileId}?w=${width}` : `/api/midia/${fileId}`;
}

/** `srcset` com descritores de largura, para o navegador escolher pelo `sizes`. */
export function mediaSrcSet(fileId: string, widths: readonly MediaWidth[]): string {
  return widths.map((w) => `${mediaUrl(fileId, w)} ${w}w`).join(", ");
}

/** Larguras e `sizes` dos lugares onde o site mostra fotos. */
export const MEDIA_PRESETS = {
  /** Hero da Home: metade da tela no desktop, tela toda no celular. */
  hero: { widths: [480, 640, 960, 1280] as const, sizes: "(min-width: 1024px) 50vw, 100vw", fallback: 960 as MediaWidth },
  /** Capa de cartão em grade de 3–4 colunas. */
  card: { widths: [320, 480, 640] as const, sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw", fallback: 480 as MediaWidth },
  /** Capa dentro do artigo (coluna estreita). */
  article: { widths: [640, 960, 1280] as const, sizes: "(min-width: 768px) 720px, 100vw", fallback: 960 as MediaWidth },
  /** Miniatura da galeria (2–3 colunas). */
  thumb: { widths: [240, 320, 480] as const, sizes: "(min-width: 640px) 33vw, 50vw", fallback: 320 as MediaWidth },
  /** Foto aberta no lightbox. */
  full: { widths: [960, 1280, 1600] as const, sizes: "92vw", fallback: 1600 as MediaWidth },
} satisfies Record<string, { widths: readonly MediaWidth[]; sizes: string; fallback: MediaWidth }>;

export type MediaPreset = keyof typeof MEDIA_PRESETS;

/** Atributos prontos (`src`, `srcSet`, `sizes`) para um `<img>` de mídia pública. */
export function mediaImage(fileId: string, preset: MediaPreset): { src: string; srcSet: string; sizes: string } {
  const p = MEDIA_PRESETS[preset];
  return { src: mediaUrl(fileId, p.fallback), srcSet: mediaSrcSet(fileId, p.widths), sizes: p.sizes };
}
