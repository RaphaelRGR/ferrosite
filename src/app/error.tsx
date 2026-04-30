"use client";

/**
 * Componente Error
 * Exibido quando ocorre algum erro não tratado na renderização.
 */
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Integrar com serviço de monitoramento de erros (ex: Sentry)
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Tentar novamente
      </button>
      {/* TODO: Melhorar a UI da página de erro */}
    </div>
  );
}
