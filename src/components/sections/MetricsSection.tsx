import { AnimatedSection } from "@/components/ui/AnimatedSection";

const METRICS = [
  { id: 1, value: "3 de 3",  description: "Cursos de Eng. Ferroviária no Brasil" },
  { id: 2, value: "10",      description: "Semestres de formação integral"        },
  { id: 3, value: "9.000 km", description: "Malha ferroviária em leilão"          },
  { id: 4, value: "2026",    description: "Ano do 1º HackFerro do curso"          },
];

/**
 * MetricsSection — grid 2×2 em mobile, 4 colunas em desktop.
 */
export function MetricsSection() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-y-10 gap-x-4 text-center sm:grid-cols-4 sm:divide-x sm:divide-[#E0E0E0]">
          {METRICS.map((metric, index) => (
            <AnimatedSection
              key={metric.id}
              delay={index * 150}
              className="flex flex-col items-center px-2 sm:px-4"
            >
              <dd className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#1A1A1A] mb-2">
                {metric.value}
              </dd>
              <dt className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#444444] leading-relaxed max-w-[120px] sm:max-w-[140px]">
                {metric.description}
              </dt>
            </AnimatedSection>
          ))}
        </dl>
      </div>
    </section>
  );
}
