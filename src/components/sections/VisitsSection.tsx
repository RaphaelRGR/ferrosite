"use client";

import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const VISITS_CONTENT = {
  title:       "Calendário de Visitas Técnicas",
  subtitle:    "Vivenciando a ferrovia na prática.",
  buttonLabel: "Ver cronograma completo",
};

const VISITS = [
  {
    id: 1,
    local: "RUMO Logística",
    date: "18 Jun 2026",
    description: "Visita ao Centro de Controle Operacional (CCO) da maior operadora do país.",
    badge: "Confirmada",
    badgeColor: "text-green-700 bg-green-50",
  },
  {
    id: 2,
    local: "Buenos Aires, ARG",
    date: "Jul 2026",
    description: "Intercâmbio técnico com a UTN e visita à rede metroviária Emova.",
    badge: "Confirmada",
    badgeColor: "text-green-700 bg-green-50",
  },
  {
    id: 3,
    local: "Polo Mineiro",
    date: "Nov 2026",
    description: "Imersão no complexo ferroviário de Minas Gerais e oficinas da VLI.",
    badge: "Planejamento",
    badgeColor: "text-orange-600 bg-orange-50",
  },
];

/**
 * VisitsSection — sem gsap, sem pin.
 * Cards responsivos com hover suave via CSS.
 */
export function VisitsSection() {
  return (
    <section className="bg-white pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 w-full">

        {/* Cabeçalho */}
        <AnimatedSection className="mb-12 sm:mb-16 md:mb-20 flex flex-col items-center text-center">
          <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-3">
            {VISITS_CONTENT.subtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#E84E1B]">
            {VISITS_CONTENT.title}
          </h2>
        </AnimatedSection>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16 md:mb-20">
          {VISITS.map((visit, index) => (
            <AnimatedSection key={visit.id} delay={index * 120}>
              <div className="group flex flex-col rounded-2xl sm:rounded-3xl border border-[#E84E1B]/10 bg-white p-6 sm:p-8 md:p-10 transition-all duration-300 ease-out hover:shadow-[0_20px_60px_rgba(232,78,27,0.12)] hover:-translate-y-2 hover:border-[#E84E1B]/30 h-full">
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <span className="text-sm font-black text-[#E84E1B]/30">{visit.date}</span>
                  <span className={`rounded-full px-3 sm:px-4 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${visit.badgeColor}`}>
                    {visit.badge}
                  </span>
                </div>
                <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-black text-[#E84E1B]">
                  {visit.local}
                </h3>
                <p className="text-[#E84E1B]/70 leading-relaxed text-sm sm:text-base md:text-lg">
                  {visit.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Link */}
        <div className="flex justify-center">
          <Link
            href="/visitas"
            className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#E84E1B] border-b-2 border-[#E84E1B] pb-1 hover:opacity-70 transition-all hover:tracking-[0.2em]"
          >
            {VISITS_CONTENT.buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
