import { AnimatedSection } from "@/components/ui/AnimatedSection";

const MANIFESTO_TEXT = "R$ 600 bilhões em investimentos previstos para o setor ferroviário brasileiro.";
const MANIFESTO_SUB = "Os engenheiros que vão executar isso estão sendo formados agora, no CTJ.";

export function ManifestoSection() {
  return (
    // Padding extra no topo para compensar a borda arredondada gigante
    <section className="bg-transparent pt-32 pb-24 lg:pt-48 lg:pb-32 relative">
      <AnimatedSection className="mx-auto max-w-5xl px-6 text-center relative z-10">
        <h3 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl mb-12 drop-shadow-xl">
          &ldquo;{MANIFESTO_TEXT}&rdquo;
        </h3>
        <p className="text-[#E84E1B] text-xl md:text-2xl font-bold tracking-wide opacity-90 drop-shadow-md">
          {MANIFESTO_SUB}
        </p>
      </AnimatedSection>
    </section>
  );
}
