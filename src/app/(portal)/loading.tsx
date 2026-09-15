import { Skeleton } from "@/components/ui/Skeleton";

/** Loading do Portal: esqueleto com a forma das páginas (cabeçalho + cartões), anunciado como status. */
export default function PortalLoading() {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </div>
  );
}
