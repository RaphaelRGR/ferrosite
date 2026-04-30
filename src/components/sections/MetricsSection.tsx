import { AnimatedSection } from "@/components/ui/AnimatedSection";

const METRICS = [
  { id: 1, value: "3 de 3", description: "Cursos de Eng. Ferroviária no Brasil" },
  { id: 2, value: "10", description: "Semestres de formação integral" },
  { id: 3, value: "9.000 km", description: "Malha ferroviária em leilão" },
  { id: 4, value: "2026", description: "Ano do 1º HackFerro do curso" },
];

export function MetricsSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <dl className="grid grid-cols-2 gap-x-12 gap-y-16 text-center sm:grid-cols-4">
          {METRICS.map((metric, index) => (
            <AnimatedSection key={metric.id} delay={index * 150} className="flex flex-col items-center">
              <dd className="text-5xl font-black tracking-tighter text-[#E84E1B] mb-2 sm:text-6xl">
                {metric.value}
              </dd>
              <dt className="text-xs font-bold uppercase tracking-widest text-[#E84E1B]/60 leading-relaxed max-w-[140px]">
                {metric.description}
              </dt>
            </AnimatedSection>
          ))}
        </dl>
      </div>
    </section>
  );
}
