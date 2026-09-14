/**
 * Loading do Portal: exibido dentro do shell do Portal durante navegação.
 */
export default function PortalLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p role="status">Carregando…</p>
      {/* TODO(PORTAL-001): skeleton coerente com o layout final */}
    </div>
  );
}
