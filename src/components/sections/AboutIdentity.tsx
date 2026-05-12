"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

const PILLARS = [
  {
    title: "Nossa Missão",
    subtitle: "Por que existimos?",
    content: "Não fomos criados apenas para diplomar engenheiros. Existimos para preencher um vazio histórico na logística nacional. Nossa missão é formar a elite técnica capaz de liderar o renascimento das ferrovias no Brasil, projetando e operando sistemas que movem a riqueza do país com segurança e eficiência máxima.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Nossa Visão",
    subtitle: "Onde queremos chegar?",
    content: "Ser o epicentro da inovação metroferroviária na América Latina. Queremos que cada quilômetro de novo trilho implantado no continente tenha a assinatura, a pesquisa ou a gestão de um profissional moldado no CTJ.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
      <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

/**
 * AboutIdentity — identidade visual do curso sem gsap.
 */
export function AboutIdentity() {
  return (
    <section className="bg-[#111111] py-20 md:py-32 border-t border-white/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#E84E1B] rounded-full mix-blend-screen filter blur-[150px] opacity-10" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter">
            A Identidade do Curso
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {PILLARS.map((pillar, index) => (
            <AnimatedSection 
              key={index}
              delay={index * 150}
              translateY="translate-y-12"
              className="group bg-[#0A0A0A] border border-white/5 p-8 md:p-10 rounded-[20px] transition-all duration-300 hover:border-[#E84E1B]/40 hover:shadow-[0_10px_30px_rgba(232,78,27,0.1)] hover:-translate-y-2 flex flex-col"
            >
              <div className="text-[#E84E1B] mb-6 md:mb-8 bg-[#E84E1B]/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#E84E1B] group-hover:text-black transition-all duration-300">
                {pillar.icon}
              </div>
              
              <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold mb-2">
                {pillar.subtitle}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 md:mb-6 tracking-tight">
                {pillar.title}
              </h3>
              
              <p className="text-white/70 leading-relaxed text-base sm:text-lg flex-grow">
                {pillar.content}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
