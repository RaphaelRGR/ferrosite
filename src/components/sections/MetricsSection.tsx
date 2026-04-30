import { AnimatedSection } from "@/components/ui/AnimatedSection";

const METRICS = [
  { id: 1, value: "3 de 3", description: "Únicos cursos de graduação em Eng. Ferroviária no Brasil" },
  { id: 2, value: "10", description: "Semestres de formação integral" },
  { id: 3, value: "9.000 km", description: "De malha ferroviária em processo de leilão em 2026" },
  { id: 4, value: "2026", description: "Ano do primeiro HackFerro da AFER" },
];

export function MetricsSection() {
  return (
    <section className="border-t border-[#3A3A3A] bg-[#1A1A1A] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-12 text-center sm:grid-cols-4 lg:gap-y-16">
          {METRICS.map((metric, index) => (
            <AnimatedSection key={metric.id} delay={index * 100} className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-sm leading-6 text-[#A0A0A0] sm:text-base">{metric.description}</dt>
              <dd className="order-first text-3xl font-bold tracking-tight text-[#E84E1B] sm:text-4xl lg:text-5xl">
                {metric.value}
              </dd>
            </AnimatedSection>
          ))}
        </dl>
      </div>
    </section>
  );
}
