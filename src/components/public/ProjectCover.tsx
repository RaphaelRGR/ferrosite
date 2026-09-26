import type { ReactNode } from "react";

/** Categorias com identidade própria; qualquer valor desconhecido cai em "other". */
export type ProjectCategoryKey = "communication" | "competition" | "extension" | "rd" | "research" | "other";

export function categoryKey(category: string): ProjectCategoryKey {
  return (["communication", "competition", "extension", "rd", "research"] as const).includes(category as never) ? (category as ProjectCategoryKey) : "other";
}

/** Cores vêm dos tokens `--cat-*` (globals.css), com contraste AA verificado em tests/unit/tokens-contrast. */
const colors = (key: ProjectCategoryKey) => ({ background: `var(--cat-${key}-bg)`, color: `var(--cat-${key}-fg)` });

const ICONS: Record<ProjectCategoryKey, ReactNode> = {
  // megafone
  communication: <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Zm12-3a5 5 0 0 1 0 8m2.5-10.5a8.5 8.5 0 0 1 0 13" />,
  // troféu
  competition: <path d="M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm0 2H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3" />,
  // capelo (extensão / escolas)
  extension: <path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5m4-2v6" />,
  // engrenagem (P&D com empresas)
  rd: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />,
  // frasco (pesquisa)
  research: <path d="M9 3h6m-5 0v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 14h9" />,
  // pessoas (entidades e demais)
  other: <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m7-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8" />,
};

function Icon({ k, className }: { k: ProjectCategoryKey; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[k]}
    </svg>
  );
}

/** Selo de categoria: cor + ícone + texto (o status não depende só da cor, 23/31). */
export function CategoryChip({ category, label }: { category: string; label: string }) {
  const k = categoryKey(category);
  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-bold" style={colors(k)} data-category={k}>
      <Icon k={k} className="size-3.5" />
      {label}
    </span>
  );
}

/**
 * Capa ilustrada do projeto enquanto não há foto autorizada: fundo da cor da
 * categoria, ícone grande e trilhos discretos. Decorativa: o nome do projeto
 * está logo abaixo, no cartão.
 */
export function ProjectCover({ category, aspect = "aspect-[16/9]" }: { category: string; aspect?: string }) {
  const k = categoryKey(category);
  return (
    <div aria-hidden="true" data-project-cover={k} className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden`} style={colors(k)}>
      <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full opacity-15" fill="none" stroke="currentColor">
        {Array.from({ length: 7 }, (_, i) => {
          const t = i / 6;
          const y = 225 - t * t * 130;
          const half = 170 - t * 130;
          return <line key={i} x1={200 - half} y1={y} x2={200 + half} y2={y} strokeWidth={9 - t * 6} strokeLinecap="round" />;
        })}
        <line x1="75" y1="225" x2="182" y2="95" strokeWidth="5" />
        <line x1="325" y1="225" x2="218" y2="95" strokeWidth="5" />
      </svg>
      <Icon k={k} className="relative size-14 opacity-80" />
    </div>
  );
}
