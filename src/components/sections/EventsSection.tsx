"use client";

import { useRef, MouseEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const EVENTS_CONTENT = {
  title: "Agenda de Eventos",
  subtitle: "Participe das nossas atividades.",
  buttonLabel: "Ver todos os eventos",
};

const EVENTS = [
  {
    id: 1,
    title: "Cavalos de Ferro 2026",
    description: "A maior competição estudantil de engenharia ferroviária das Américas.",
    tag: "Inscrições Abertas",
    date: "01 Julho",
    icon: "🏆"
  },
  {
    id: 2,
    title: "HackFerro",
    description: "Desenvolvendo soluções tecnológicas para os desafios do transporte sobre trilhos.",
    tag: "Em Breve",
    date: "Setembro",
    icon: "⚡"
  },
];

export function EventsSection() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>, index: number) => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const card = cardsRef.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1000,
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <section className="bg-[#0A0A0A] py-20 md:py-28 overflow-hidden perspective-[1000px]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div>
            <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
              {EVENTS_CONTENT.subtitle}
            </span>
            <h2 className="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
              {EVENTS_CONTENT.title}
            </h2>
          </div>
          <Link
            href="/eventos"
            className="text-sm font-black uppercase tracking-widest text-white/40 hover:text-[#E84E1B] transition-colors"
          >
            {EVENTS_CONTENT.buttonLabel} →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {EVENTS.map((event, index) => (
            <AnimatedSection 
              key={event.id}
              delay={index * 200}
            >
              <div 
                ref={(el) => { cardsRef.current[index] = el; }}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={() => handleMouseLeave(index)}
                className="group relative flex flex-col rounded-[2.5rem] bg-white/5 border border-white/10 p-10 backdrop-blur-xl transition-colors hover:bg-white/10 hover:border-[#E84E1B]/30 h-full will-change-transform"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="mb-8 flex items-center justify-between" style={{ transform: "translateZ(30px)" }}>
                  <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{event.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-[#E84E1B]">
                    {event.tag}
                  </span>
                </div>
                <h3 className="mb-4 text-3xl font-black text-white" style={{ transform: "translateZ(40px)" }}>{event.title}</h3>
                <p className="mb-8 text-white/50 text-lg leading-relaxed" style={{ transform: "translateZ(20px)" }}>
                  {event.description}
                </p>
                <div className="mt-auto pt-8 border-t border-white/10 text-sm font-bold text-white/40" style={{ transform: "translateZ(10px)" }}>
                  Data prevista: <span className="text-white ml-2">{event.date}</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
