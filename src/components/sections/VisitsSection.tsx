import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const VISITS_CONTENT = {
  title: "Onde nossos alunos vão em 2026",
  buttonLabel: "Ver todas as visitas →",
  buttonHref: "/visitas",
};

const VISITS = [
  {
    id: 1,
    local: "RUMO Logística",
    date: "18 de junho de 2026",
    description: "Visita à maior operadora ferroviária da América Latina.",
    badge: "Confirmada",
    badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    id: 2,
    local: "Buenos Aires, Argentina",
    date: "Julho de 2026",
    description: "Emova, Metrovías e UTN Buenos Aires.",
    badge: "Confirmada",
    badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    id: 3,
    local: "Minas Gerais",
    date: "Novembro de 2026",
    description: "Visita técnica ao polo ferroviário mineiro.",
    badge: "Em planejamento",
    badgeColor: "bg-gray-500/10 text-[#A0A0A0] border-[#3A3A3A]",
  },
];

export function VisitsSection() {
  return (
    <section className="bg-[#1A1A1A] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0">
        <AnimatedSection>
          <h2 className="mb-12 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {VISITS_CONTENT.title}
          </h2>

          <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VISITS.map((visit) => (
              <article
                key={visit.id}
                className="flex flex-col border-l-4 border-[#E84E1B] bg-[#2E2E2E] p-8 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(232,78,27,0.15)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A0A0A0]">{visit.date}</span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${visit.badgeColor}`}>
                    {visit.badge}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{visit.local}</h3>
                <p className="text-base text-[#A0A0A0]">{visit.description}</p>
              </article>
            ))}
          </div>

          <div className="flex justify-center lg:justify-start">
            <Link
              href={VISITS_CONTENT.buttonHref}
              className="flex min-h-[44px] items-center text-base font-semibold leading-6 text-[#E84E1B] transition-colors hover:text-[#E84E1B]/80"
            >
              {VISITS_CONTENT.buttonLabel}
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
