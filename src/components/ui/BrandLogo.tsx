import Image from "next/image";

/**
 * Logo oficial (cópia inalterada de referencias_ferro/LOGOS DE FERROCOMUNICA (1).png).
 * É um lockup vertical com fundo branco: vai sempre sobre "media mat" claro com
 * respiro (06/06A). Sem símbolo isolado, vetor ou versão para fundo escuro até a
 * instituição fornecer os originais — [CONTEÚDO PENDENTE].
 */
export function BrandLogo({ width = 160, className = "" }: { width?: number; className?: string }) {
  return (
    <span className={`inline-block rounded-lg bg-white p-2 ${className}`}>
      <Image
        src="/brand/efm-logo-lockup.png"
        alt="Engenharia Ferroviária & Metroviária"
        width={width}
        height={width}
        sizes={`${width}px`}
        className="block h-auto"
        style={{ width }}
      />
    </span>
  );
}
