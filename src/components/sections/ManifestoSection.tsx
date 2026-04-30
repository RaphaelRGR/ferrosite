import { AnimatedSection } from "@/components/ui/AnimatedSection";

const MANIFESTO_TEXT = "R$ 600 bilhões em investimentos previstos para o setor ferroviário brasileiro. Os engenheiros que vão executar isso estão sendo formados agora.";

export function ManifestoSection() {
  return (
    <section className="bg-[#E84E1B] py-12 sm:py-24 lg:py-32">
      <AnimatedSection className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0 text-center">
        <p className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-5xl">
          &ldquo;{MANIFESTO_TEXT}&rdquo;
        </p>
      </AnimatedSection>
    </section>
  );
}
