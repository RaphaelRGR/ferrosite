import Image from "next/image";

/** Proporção do lockup oficial (public/brand/efm-logo-lockup.png, 1122 × 1402, fundo transparente). */
export const LOGO_RATIO = 1402 / 1122;

/**
 * Logo oficial (lockup vertical, enviado pela coordenação em 2026-10-16; arquivo sem alteração).
 * O texto é escuro sobre fundo transparente: vai sempre sobre o "media mat" branco com respiro
 * (06/06A), inclusive no tema escuro do Portal. Altura pela proporção real, para o espaço
 * reservado não mudar quando a imagem carrega (sem CLS).
 */
export function BrandLogo({ width = 160, className = "" }: { width?: number; className?: string }) {
  const height = Math.round(width * LOGO_RATIO);
  return (
    <span className={`inline-block rounded-lg bg-white p-2 ${className}`}>
      <Image
        src="/brand/efm-logo-lockup.png"
        alt="Engenharia Ferroviária & Metroviária"
        width={width}
        height={height}
        sizes={`${width}px`}
        className="block"
        style={{ width, height }}
      />
    </span>
  );
}
