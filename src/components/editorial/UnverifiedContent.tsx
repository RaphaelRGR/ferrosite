import type { ReactNode } from "react";
import { sectionStatus, shouldRender } from "@/content/quarantine";
import { UnverifiedFrame } from "./UnverifiedFrame";

/**
 * Marca de quarentena editorial (BASE-002). Envolve uma seção cujo conteúdo
 * está inventariado em content/editorial-inventory.json:
 * - VERIFIED: renderiza sem marca;
 * - UNVERIFIED em modo review: renderiza com selo visível "Conteúdo em verificação";
 * - UNVERIFIED em modo strict ou DISCARDED: não renderiza.
 *
 * Server Component de propósito: a decisão acontece no servidor, então o
 * conteúdo oculto não vai nem para o HTML nem para o payload da página (antes,
 * como Client Component, o texto escondido ainda seguia no código-fonte).
 */
export function UnverifiedContent({
  section,
  children,
  badgePosition = "top-right",
}: {
  section: string;
  children: ReactNode;
  badgePosition?: "top-right" | "bottom-left";
}) {
  const status = sectionStatus(section);
  if (!shouldRender(status)) return null;
  if (status === "VERIFIED") return <>{children}</>;
  return (
    <UnverifiedFrame section={section} badgePosition={badgePosition}>
      {children}
    </UnverifiedFrame>
  );
}
