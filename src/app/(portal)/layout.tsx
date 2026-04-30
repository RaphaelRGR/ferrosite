/**
 * Layout do Portal Restrito
 * Envolve todas as rotas da área restrita do portal, definindo a estrutura base para usuários autenticados.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: Implementar componente de Sidebar aqui */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
