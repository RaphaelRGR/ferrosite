/** Placeholder de carregamento que preserva geometria; sem pulso em movimento reduzido. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none ${className}`}
    />
  );
}
