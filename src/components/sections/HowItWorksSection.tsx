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
    text: "Parceria com IFMG Santos Dumont. Competições como Cavalos de Ferro. Projetos do Comunica Ferro que conectam alunos com o mercado ferroviário."
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
      // Pin da coluna da esquerda com ajuste de centralização vertical
      ScrollTrigger.create({
        trigger: leftColRef.current,
        start: "top 25%",
        endTrigger: sectionRef.current,
        end: "bottom 75%",
        pin: true,
        pinSpacing: false,
      });

      // Animação para cada etapa
      stepsRef.current.forEach((step, i) => {
        if (!step) return;
        
        const content = step.querySelector('.step-content');
        const line = step.querySelector('.step-line');
        
        gsap.timeline({
          scrollTrigger: {
            trigger: step,
            start: "top 60%",
            end: "bottom 40%",
            toggleActions: "play reverse play reverse",
            onEnter: () => step.classList.add('is-active'),
            onLeave: () => step.classList.remove('is-active'),
            onEnterBack: () => step.classList.add('is-active'),
            onLeaveBack: () => step.classList.remove('is-active'),
          }
        })
        .to(content, { 
          x: 20, 
          opacity: 1, 
          duration: 0.5, 
          ease: "power2.out" 
        })
        .to(line, { 
          scaleY: 1, 
          duration: 0.5, 
          ease: "power2.inOut" 
        }, 0);
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0A0A0A] py-32 md:py-48 flex items-start border-t border-white/5 relative overflow-hidden">
      {/* Background Glow sutil */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#E84E1B] opacity-[0.03] blur-[150px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 w-full flex flex-col md:flex-row gap-16 md:gap-32 items-start">
        
        {/* Coluna Pinned */}
        <div ref={leftColRef} className="md:w-2/5 will-change-transform">
          <span className="text-[#E84E1B] font-bold tracking-[0.3em] uppercase text-[10px] mb-6 block">
            Jornada Acadêmica
          </span>
          <h2 className="text-4xl font-black tracking-tighter text-white sm:text-6xl md:text-7xl leading-[0.9] mb-8">
            Da sala de aula <br />
            <span className="text-white/20 transition-colors duration-700 group-[.is-active]:text-white">aos trilhos</span>
          </h2>
          <p className="text-white/40 text-lg max-w-sm leading-relaxed">
            Entenda o processo de formação e como conectamos você diretamente com as maiores empresas do setor.
          </p>
        </div>

        {/* Coluna Scrollavel */}
        <div className="md:w-3/5 flex flex-col gap-32 md:gap-48 py-20">
          {STEPS.map((step, index) => (
            <div 
              key={step.id} 
              ref={(el) => { stepsRef.current[index] = el; }}
              className="group relative pl-12 transition-all duration-700 ease-out"
            >
              {/* Linha de progresso vertical individual */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/5">
                <div className="step-line absolute inset-0 bg-[#E84E1B] origin-top scale-y-0 transition-transform duration-500" />
              </div>

              <div className="step-content opacity-20 translate-x-[-10px] transition-all duration-700 ease-out group-[.is-active]:opacity-100 group-[.is-active]:translate-x-0">
                <div className="flex items-center gap-6 mb-6 text-white">
                  <div className="text-[#E84E1B] p-3 rounded-2xl bg-[#E84E1B]/5 border border-[#E84E1B]/10 shadow-[0_0_20px_rgba(232,78,27,0.1)] transition-transform duration-500 group-hover:scale-110">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">{step.title}</h3>
                </div>
                <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-xl group-hover:text-white/80 transition-colors duration-500">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
