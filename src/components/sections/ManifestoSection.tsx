import { AnimatedSection } from "@/components/ui/AnimatedSection";

const MANIFESTO_TEXT = "R$ 600 bilhões em investimentos previstos para o setor ferroviário brasileiro.";
const MANIFESTO_SUB = "Os engenheiros que vão executar isso estão sendo formados agora, no CTJ.";

export function ManifestoSection() {
  return (
    // Padding extra no topo para compensar a borda arredondada gigante
    <section className="bg-transparent py-20 md:py-28 relative">
      <AnimatedSection className="mx-auto max-w-5xl px-6 text-center relative z-10">
        <h3 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl mb-8 drop-shadow-xl">
          {MANIFESTO_TEXT}
        </h3>
        <p className="text-white opacity-80 text-lg md:text-xl font-medium tracking-wide drop-shadow-md">
          {MANIFESTO_SUB}
        </p>
      </AnimatedSection>
    </section>
  );
}
