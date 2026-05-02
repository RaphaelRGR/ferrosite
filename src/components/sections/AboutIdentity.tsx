"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PILLARS = [
  {
    title: "Nossa Missão",
    subtitle: "Por que existimos?",
    content: "Não fomos criados apenas para diplomar engenheiros. Existimos para preencher um vazio histórico na logística nacional. Nossa missão é formar a elite técnica capaz de liderar o renascimento das ferrovias no Brasil, projetando e operando sistemas que movem a riqueza do país com segurança e eficiência máxima.",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Nossa Visão",
    subtitle: "Onde queremos chegar?",
    content: "Ser o epicentro da inovação metroferroviária na América Latina. Queremos que cada quilômetro de novo trilho implantado no continente tenha a assinatura, a pesquisa ou a gestão de um profissional moldado no CTJ.",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  {
    title: "Nossos Valores",
    subtitle: "O que nos move?",
    content: "Rigor técnico inegociável, segurança operacional absoluta, sustentabilidade sistêmica e coragem para inovar em um setor tradicional. O trem não recua, ele avança. Esse é o nosso espírito.",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

export function AboutIdentity() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "bottom 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#111111] py-32 border-t border-white/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#E84E1B] rounded-full mix-blend-screen filter blur-[150px] opacity-10" />
      </div>

      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">
            A Identidade do Curso
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PILLARS.map((pillar, index) => (
            <div 
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group bg-[#0A0A0A] border border-white/5 p-10 rounded-[20px] transition-all duration-300 hover:border-[#E84E1B]/40 hover:shadow-[0_10px_30px_rgba(232,78,27,0.1)] hover:-translate-y-2 flex flex-col"
            >
              <div className="text-[#E84E1B] mb-8 bg-[#E84E1B]/10 w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#E84E1B] group-hover:text-black transition-all duration-300">
                {pillar.icon}
              </div>
              
              <span className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">
                {pillar.subtitle}
              </span>
              <h3 className="text-3xl font-black text-white mb-6">
                {pillar.title}
              </h3>
              
              <p className="text-white/70 leading-relaxed text-lg flex-grow">
                {pillar.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
