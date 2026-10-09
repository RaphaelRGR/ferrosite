import { PageSkeleton } from "@/components/portal/shell/PageSkeleton";

/**
 * Loading do Portal. PERF-002: o mesmo esqueleto existe em cada pasta com
 * subpáginas (`portal/.../loading.tsx`). Uma fronteira só no topo não aparece ao
 * navegar entre páginas irmãs (o segmento de cima não muda), e o clique parecia
 * travado até a página nova chegar inteira.
 */
export default PageSkeleton;
