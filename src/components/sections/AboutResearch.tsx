"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

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

/**
 * AboutResearch — linhas de pesquisa sem gsap.
 */
export function AboutResearch() {
  return (
    <section className="bg-[#0A0A0A] py-20 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        <AnimatedSection className="mb-16 md:mb-20 md:w-2/3">
          <span className="text-[#E84E1B] font-bold tracking-[0.3em] uppercase text-[10px] mb-4 block">
            Linhas de Pesquisa
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
            O Laboratório do Setor
          </h2>
          <p className="text-lg sm:text-xl text-white/60 leading-relaxed">
            Não somos apenas um curso técnico. Somos o braço de pesquisa e desenvolvimento que as grandes concessionárias procuram quando a teoria dos livros não basta para resolver problemas reais de via.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {RESEARCH_LINES.map((item, index) => (
            <AnimatedSection 
              key={index}
              delay={index * 150}
              translateY="translate-y-12"
            >
              <div className="bg-[#111111] border border-white/10 p-8 md:p-10 rounded-2xl group hover:border-[#E84E1B]/50 transition-all duration-300 h-full">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-[#E84E1B] transition-colors tracking-tight">
                  {item.title}
                </h3>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8">
                  {item.description}
                </p>
                
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-auto">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#1A1A1A] text-white/40 text-[10px] font-bold uppercase tracking-wider group-hover:bg-[#E84E1B]/10 group-hover:text-[#E84E1B] transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

      </div>
    </section>
  );
}
