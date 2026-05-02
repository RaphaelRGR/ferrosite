"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  {
    id: 1,
    title: "Ingressar",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
    text: "20 vagas por semestre via SiSU e Vestibular UFSC. Turno integral, 5 anos de formação técnica e humanística no CTJ — Joinville."
  },
  {
    id: 2,
    title: "Aprender na prática",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    text: "Visitas técnicas a concessionárias, laboratórios e operadoras. Contato real com locomotivas, via permanente e sistemas de sinalização."
  },
  {
    id: 3,
    title: "Conectar com o setor",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    text: "Parceria com IFMG Santos Dumont. Competições como Cavalos de Ferro. Projetos da AFER que conectam alunos com o mercado ferroviário."
  },
  {
    id: 4,
    title: "Atuar no mercado",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    text: "Rumo, MRS, VLI, Vale, ANPTrilhos. O Brasil vai investir R$ 600 bilhões em ferrovias. Os engenheiros que vão executar isso saem daqui."
  }
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Pin apenas a coluna da esquerda
      ScrollTrigger.create({
        trigger: leftColRef.current,
        start: "top 30%",
        endTrigger: sectionRef.current,
        end: "bottom 80%",
        pin: true,
        pinSpacing: false,
      });

      stepsRef.current.forEach((step) => {
        if (!step) return;
        
        ScrollTrigger.create({
          trigger: step,
          start: "top 60%",
          end: "bottom 40%",
          toggleClass: "is-active"
        });
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0A0A0A] py-32 flex items-start border-t border-white/5 relative">
      <div className="mx-auto max-w-6xl px-6 w-full flex flex-col md:flex-row gap-16 items-start">
        
        {/* Coluna Pinned */}
        <div ref={leftColRef} className="md:w-1/3">
          <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
            Como funciona
          </span>
          <h2 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Da sala de aula aos trilhos
          </h2>
        </div>

        {/* Coluna Scrollavel */}
        <div className="md:w-2/3 flex flex-col gap-24 py-10">
          {STEPS.map((step, index) => (
            <div 
              key={step.id} 
              ref={(el) => { stepsRef.current[index] = el; }}
              className="group pl-8 border-l-2 border-white/10 opacity-30 transition-all duration-500 ease-out [&.is-active]:opacity-100 [&.is-active]:border-[#E84E1B]"
            >
              <div className="flex items-center gap-4 mb-4 text-white">
                <div className="text-[#E84E1B] transition-colors">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold">{step.title}</h3>
              </div>
              <p className="text-white/70 text-lg leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
