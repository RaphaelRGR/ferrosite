"use client";

import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const EVENTS_CONTENT = {
  title:       "Agenda de Eventos",
  subtitle:    "Participe das nossas atividades.",
  buttonLabel: "Ver todos os eventos",
};

const EVENTS = [
  {
    id: 1,
    title:       "Cavalos de Ferro 2026",
    description: "A maior competição estudantil de engenharia ferroviária das Américas.",
    tag:  "Inscrições Abertas",
    date: "01 Julho",
    icon: "🏆",
  },
  {
    id: 2,
    title:       "HackFerro",
    description: "Desenvolvendo soluções tecnológicas para os desafios do transporte sobre trilhos.",
    tag:  "Em Breve",
    date: "Setembro",
    icon: "⚡",
  },
];

/**
 * EventsSection — sem gsap.
 * Efeito 3D removido (causava glitches em mobile).
 * Hover suave via CSS transition.
 */
export function EventsSection() {
  return (
    <section className="bg-[#0A0A0A] py-16 sm:py-20 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 md:mb-20 gap-5 sm:gap-8">
          <div>
            <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-3 block">
              {EVENTS_CONTENT.subtitle}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white">
              {EVENTS_CONTENT.title}
            </h2>
          </div>
          <Link
            href="/eventos"
            className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/40 hover:text-[#E84E1B] transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            {EVENTS_CONTENT.buttonLabel} →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:gap-8 lg:grid-cols-2">
          {EVENTS.map((event, index) => (
            <AnimatedSection key={event.id} delay={index * 200}>
              <div className="group flex flex-col rounded-2xl sm:rounded-[2.5rem] bg-white/5 border border-white/10 p-6 sm:p-8 md:p-10 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-[#E84E1B]/30 hover:-translate-y-1 h-full">
                <div className="mb-6 sm:mb-8 flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl md:text-5xl transition-transform duration-300 group-hover:scale-110">
                    {event.icon}
                  </span>
                  <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-[#E84E1B]">
                    {event.tag}
                  </span>
                </div>
                <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-black text-white">
                  {event.title}
                </h3>
                <p className="mb-6 sm:mb-8 text-white/50 text-sm sm:text-base md:text-lg leading-relaxed">
                  {event.description}
                </p>
                <div className="mt-auto pt-5 sm:pt-8 border-t border-white/10 text-xs sm:text-sm font-bold text-white/40">
                  Data prevista:{" "}
                  <span className="text-white ml-2">{event.date}</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
