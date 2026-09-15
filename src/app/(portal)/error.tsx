"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Erro do Portal: mantém o shell do Portal e oferece nova tentativa.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(OPS-001): integrar com monitoramento de erros
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="text-xl font-bold">Algo deu errado no Portal.</h1>
      <Button className="mt-4" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
