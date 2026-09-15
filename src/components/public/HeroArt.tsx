/**
 * Arte conceitual (não fotográfica, não documental — 25) para heros enquanto
 * não há fotografia oficial autorizada: trilhos em perspectiva com acentos
 * institucionais. Usa tokens, então funciona em qualquer tema.
 */
export function HeroArt({ title, className = "" }: { title: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 800 560"
      role="img"
      aria-label={title}
      className={`h-auto w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--bg-surface-2)" />
          <stop offset="1" stopColor="var(--bg-surface)" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="560" rx="32" fill="url(#sky)" />
      <circle cx="600" cy="150" r="210" fill="url(#glow)" />
      {/* horizonte e cidade estilizada */}
      <g fill="var(--border-subtle)">
        <rect x="90" y="250" width="40" height="70" />
        <rect x="140" y="220" width="30" height="100" />
        <rect x="180" y="260" width="55" height="60" />
        <rect x="560" y="235" width="35" height="85" />
        <rect x="605" y="205" width="45" height="115" />
        <rect x="660" y="250" width="30" height="70" />
      </g>
      <rect x="0" y="320" width="800" height="240" fill="var(--bg-canvas)" />
      {/* dormentes */}
      <g stroke="var(--border-strong)" strokeWidth="6" strokeLinecap="round" opacity="0.7">
        <line x1="120" y1="540" x2="680" y2="540" />
        <line x1="160" y1="500" x2="640" y2="500" />
        <line x1="195" y1="465" x2="605" y2="465" />
        <line x1="225" y1="435" x2="575" y2="435" />
        <line x1="250" y1="410" x2="550" y2="410" />
        <line x1="272" y1="390" x2="528" y2="390" />
        <line x1="290" y1="373" x2="510" y2="373" />
        <line x1="306" y1="359" x2="494" y2="359" />
        <line x1="320" y1="348" x2="480" y2="348" />
      </g>
      {/* trilhos */}
      <g fill="none" strokeLinecap="round">
        <path d="M150 560 L372 335" stroke="var(--accent)" strokeWidth="10" />
        <path d="M650 560 L428 335" stroke="var(--accent)" strokeWidth="10" />
        <path d="M150 560 L372 335 M650 560 L428 335" stroke="var(--bg-surface)" strokeWidth="3" opacity="0.6" />
      </g>
      {/* sinal */}
      <g>
        <rect x="690" y="290" width="6" height="60" fill="var(--border-strong)" />
        <rect x="676" y="262" width="34" height="34" rx="8" fill="var(--text-primary)" />
        <circle cx="693" cy="279" r="8" fill="var(--status-success)" />
      </g>
      <g fill="var(--accent)">
        <circle cx="400" cy="330" r="6" />
      </g>
    </svg>
  );
}
