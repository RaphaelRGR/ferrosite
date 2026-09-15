import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = { title: "Questões" };

/**
 * Placeholder herdado do protótipo: a continuidade de "Questões" é decisão
 * pendente (33, pergunta 6). Fica fora do menu e declara a pendência em vez de
 * fingir funcionalidade; não é removido sem decisão.
 */
export default function PortalQuestoesPage() {
  const dict = getDictionary("pt");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black">Questões</h1>
      <EmptyState
        title={dict.pending.title}
        description="[CONTEÚDO PENDENTE] — a coordenação ainda não decidiu se o módulo de questões continua (decisões e conflitos, pergunta 6)."
        action={
          <LinkButton href="/portal" variant="secondary">
            {dict.portal.notFound.back}
          </LinkButton>
        }
      />
    </div>
  );
}
