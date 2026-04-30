/**
 * Componente Loading
 * Exibido automaticamente pelo Next.js durante a navegação entre rotas que exigem processamento no servidor.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1>Carregando...</h1>
      {/* TODO: Implementar um skeleton ou spinner */}
    </div>
  );
}
