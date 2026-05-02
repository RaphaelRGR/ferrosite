"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const RESEARCH_LINES = [
  {
    title: "Dinâmica Ferroviária e Roda-Trilho",
    description: "Pesquisa pesada sobre a física do contato entre a roda de aço e o trilho de aço. Estudamos fadiga, desgaste, descarrilamento e como otimizar os truques para suportar os pesados trens de minério brasileiros.",
    tags: ["Mecânica", "Fadiga", "Segurança"]
  },
  {
    title: "Logística e Otimização de Malhas",
    description: "Análise complexa de cruzamentos, pátios e escoamento de safra. Desenvolvemos modelos matemáticos para aumentar a capacidade da via, reduzir gargalos e sincronizar frotas de locomotivas.",
    tags: ["Operações", "Logística", "Modelagem"]
  },
  {
    title: "Via Permanente e Infraestrutura",
    description: "O chão que aguenta o peso do Brasil. Avaliação de dormentes, lastros, sublastros e geotecnia ferroviária para garantir que a linha férrea dure décadas sem ceder sob trens de 33 toneladas por eixo.",
    tags: ["Infraestrutura", "Geotecnia", "Materiais"]
  },
  {
    title: "Sinalização e Controle de Tráfego",
    description: "Do PTC (Positive Train Control) ao CBTC em metrôs. Como fazer dezenas de trens correrem no mesmo trilho, na mesma direção, freando com segurança, usando telecomunicações avançadas.",
    tags: ["Sistemas", "Automação", "Controle"]
  }
];

export function AboutResearch() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        
        gsap.fromTo(card, 
          { opacity: 0, x: -50 },
          {
            opacity: 1, 
            x: 0, 
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 60%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-[#0A0A0A] py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        
        <div className="mb-20 md:w-2/3">
          <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
            Linhas de Pesquisa
          </span>
          <h2 className="text-4xl font-black text-white tracking-tighter sm:text-5xl mb-6">
            O Laboratório do Setor
          </h2>
          <p className="text-xl text-white/60 leading-relaxed">
            Não somos apenas um curso técnico. Somos o braço de pesquisa e desenvolvimento que as grandes concessionárias procuram quando a teoria dos livros não basta para resolver problemas reais de via.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {RESEARCH_LINES.map((item, index) => (
            <div 
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="bg-[#111111] border border-white/10 p-10 rounded-2xl group hover:border-[#E84E1B]/50 transition-colors duration-300"
            >
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#E84E1B] transition-colors">
                {item.title}
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                {item.description}
              </p>
              
              <div className="flex flex-wrap gap-3">
                {item.tags.map(tag => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-[#1A1A1A] text-white/40 text-xs font-bold uppercase tracking-wider group-hover:bg-[#E84E1B]/10 group-hover:text-[#E84E1B] transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
