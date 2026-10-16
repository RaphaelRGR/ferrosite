import Image from "next/image";
import "./brand-logo.css";

/** Proporção do lockup oficial (1122 × 1402, fundo transparente), igual nas duas versões. */
export const LOGO_RATIO = 1402 / 1122;

/**
 * Logo oficial (lockup vertical, enviado pela coordenação em 2026-10-16; arquivos sem alteração):
 * `efm-logo-lockup.png` tem letra preta (fundo claro) e `efm-logo-lockup-white.png`, letra branca
 * (fundo escuro). Sem moldura branca: a versão certa aparece pelo tema (brand-logo.css), o site
 * público é sempre claro e o Portal alterna. Altura pela proporção real, para não haver CLS.
 */
export function BrandLogo({ width = 160, className = "" }: { width?: number; className?: string }) {
  const height = Math.round(width * LOGO_RATIO);
  const common = { width, height, sizes: `${width}px`, style: { width, height } } as const;
  return (
    <span className={`inline-block shrink-0 ${className}`}>
      <Image {...common} src="/brand/efm-logo-lockup.png" alt="Engenharia Ferroviária & Metroviária" className="brand-logo-on-light block" />
      <Image {...common} src="/brand/efm-logo-lockup-white.png" alt="Engenharia Ferroviária & Metroviária" className="brand-logo-on-dark block" />
    </span>
  );
}
