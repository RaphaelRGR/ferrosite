"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const VISITS_CONTENT = {
  title: "Calendário de Visitas Técnicas",
  subtitle: "Vivenciando a ferrovia na prática.",
  buttonLabel: "Ver cronograma completo",
};

const VISITS = [
  {
    id: 1,
    local: "RUMO Logística",
    date: "18 Jun 2026",
    description: "Visita ao Centro de Controle Operacional (CCO) da maior operadora do país.",
    badge: "Confirmada",
    badgeColor: "text-green-600 bg-green-50",
  },
  {
    id: 2,
    local: "Buenos Aires, ARG",
    date: "Jul 2026",
    description: "Intercâmbio técnico com a UTN e visita à rede metroviária Emova.",
    badge: "Confirmada",
    badgeColor: "text-green-600 bg-green-50",
  },
  {
    id: 3,
    local: "Polo Mineiro",
    date: "Nov 2026",
    description: "Imersão no complexo ferroviário de Minas Gerais e oficinas da VLI.",
    badge: "Planejamento",
    badgeColor: "text-[#E84E1B]/50 bg-orange-50",
  },
];

export function VisitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Set initial state for cards
      gsap.set(cardsRef.current, { x: 100, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%",
          scrub: 1,
          pin: true,
        }
      });

      tl.to(cardsRef.current, {
        x: 0,
        opacity: 1,
        stagger: 0.2,
        ease: "power2.out",
        duration: 1
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-20 md:py-28 h-screen flex flex-col justify-center overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 w-full">
        <div className="mb-20 flex flex-col items-center text-center">
          <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4">
            {VISITS_CONTENT.subtitle}
          </span>
          <h2 className="text-4xl font-black tracking-tighter text-[#E84E1B] sm:text-5xl lg:text-6xl">
            {VISITS_CONTENT.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
          {VISITS.map((visit, index) => (
            <div 
              key={visit.id} 
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group flex flex-col rounded-3xl border border-[#E84E1B]/10 bg-white p-10 transition-all duration-300 ease-out hover:shadow-[0_20px_60px_rgba(232,78,27,0.15)] hover:-translate-y-3 hover:scale-[1.02] hover:border-[#E84E1B]/30 will-change-[transform,opacity]"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-black text-[#E84E1B]/30">{visit.date}</span>
                <span className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest ${visit.badgeColor}`}>
                  {visit.badge}
                </span>
              </div>
              <h3 className="mb-4 text-3xl font-black text-[#E84E1B] transition-colors">
                {visit.local}
              </h3>
              <p className="text-[#E84E1B]/70 leading-relaxed text-lg">
                {visit.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/visitas"
            className="text-sm font-black uppercase tracking-widest text-[#E84E1B] border-b-2 border-[#E84E1B] pb-1 hover:opacity-70 transition-all hover:tracking-[0.2em]"
          >
            {VISITS_CONTENT.buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
