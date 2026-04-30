/**
 * Componente NotFound
 * Exibido quando o usuário tenta acessar uma rota inexistente (Erro 404).
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2>Página Não Encontrada</h2>
      <p className="mt-2">Não conseguimos localizar o conteúdo que você solicitou.</p>
      <Link href="/" className="mt-4 text-blue-600 hover:underline">
        Voltar para a página inicial
      </Link>
      {/* TODO: Criar design para a página 404 */}
    </div>
  );
}
