"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

const PILLARS = [
  {
    title: "Ensino",
    description: "Formação técnica de excelência no único curso de Engenharia Ferroviária e Metroviária do Sul do Brasil, focado em infraestrutura, material rodante e gestão.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    title: "Pesquisa",
    description: "Desenvolvimento de novas tecnologias para o setor ferroviário, desde simulações de dinâmica ferroviária até otimização de malhas e logística.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Extensão",
    description: "Conexão direta com o mercado através do Comunica Ferro e do FerroSite, promovendo hackathons, visitas técnicas e eventos que integram academia e indústria.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
];

export function AboutPillars() {
  return (
    <section className="bg-[#0A0A0A] py-24 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map((pillar, index) => (
            <AnimatedSection 
              key={pillar.title} 
              delay={index * 200}
              className="group p-8 rounded-2xl bg-[#111111] border border-white/5 hover:border-[#E84E1B]/30 transition-all duration-300"
            >
              <div className="text-[#E84E1B] mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {pillar.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{pillar.title}</h3>
              <p className="text-white/60 leading-relaxed">
                {pillar.description}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
