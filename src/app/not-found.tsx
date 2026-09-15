/**
 * Componente NotFound
 * Exibido quando o usuário tenta acessar uma rota inexistente (Erro 404).
 * Renderizado pelo root layout (mínimo), por isso monta o shell público aqui.
 */
import { PublicShell } from "@/components/layout/PublicShell";
import { LinkButton } from "@/components/ui/LinkButton";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1>Página Não Encontrada</h1>
        <p className="mt-2">Não conseguimos localizar o conteúdo que você solicitou.</p>
        <LinkButton href="/" variant="secondary" className="mt-6">
          Voltar para a página inicial
        </LinkButton>
        {/* TODO: Criar design para a página 404 */}
      </div>
    </PublicShell>
  );
}
