"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

const EVENTS = [
  {
    year: "2014",
    title: "Fundação do Curso",
    description: "A UFSC Joinville inaugura o primeiro curso de Engenharia Ferroviária e Metroviária do Sul do Brasil, respondendo à demanda por infraestrutura de transporte no país."
  },
  {
    year: "2018",
    title: "Criação do Comunica Ferro",
    description: "Surge o Comunica Ferro, unindo alunos e professores para promover a cultura ferroviária além das salas de aula."
  },
  {
    year: "2020",
    title: "Lançamento do FerroSite",
    description: "O portal FerroSite nasce como o hub digital oficial para centralizar notícias, eventos e conhecimentos do setor ferroviário acadêmico."
  },
  {
    year: "2024",
    title: "Referência Nacional",
    description: "Com centenas de egressos nas maiores empresas do setor (Vale, Rumo, VLI), o curso consolida-se como referência técnica no Brasil."
  }
];

/**
 * AboutHistory — linha do tempo responsiva sem gsap.
 */
export function AboutHistory() {
  return (
    <section className="bg-[#0A0A0A] py-20 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center text-white mb-16 md:mb-20 tracking-tighter">
          Nossa Trajetória
        </h2>
        
        <div className="relative border-l border-white/10 ml-4 md:ml-0 md:border-l-0">
          {/* Linha central no desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2" />

          {EVENTS.map((event, index) => (
            <AnimatedSection 
              key={event.year}
              delay={index * 150}
              translateY="translate-y-8"
              className={`relative mb-16 md:mb-20 md:w-1/2 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12 md:ml-auto md:text-left"}`}
            >
              {/* Dot mobile */}
              <div className="absolute left-[-21px] top-2 w-10 h-10 rounded-full bg-[#111111] border border-[#E84E1B] flex md:hidden items-center justify-center z-10" />
              
              {/* Dot desktop */}
              <div className={`hidden md:flex absolute top-2 w-4 h-4 rounded-full bg-[#E84E1B] shadow-[0_0_15px_rgba(232,78,27,0.5)] z-10 ${index % 2 === 0 ? "right-[-8.5px]" : "left-[-8.5px]"}`} />

              <span className="text-[#E84E1B] font-mono text-lg font-bold mb-2 block">
                {event.year}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 tracking-tight">{event.title}</h3>
              <p className="text-white/50 text-base sm:text-lg leading-relaxed">
                {event.description}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
