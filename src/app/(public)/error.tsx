"use client";

/**
 * Componente Error
 * Exibido quando ocorre algum erro não tratado na renderização.
 */
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

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
      <h1>Algo deu errado!</h1>
      <Button className="mt-4" onClick={() => reset()}>
        Tentar novamente
      </Button>
      {/* TODO: Melhorar a UI da página de erro */}
    </div>
  );
}
