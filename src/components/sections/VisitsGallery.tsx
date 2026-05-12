"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

const PAST_VISITS = [
  {
    title: "CCO Rumo Logística",
    location: "Curitiba - PR",
    year: "2023",
    description: "Visita ao maior Centro de Controle Operacional da América Latina, onde é gerida toda a malha sul e central do Brasil.",
    image: "https://placehold.co/800x600/1A1A1A/E84E1B?text=CCO+Rumo"
  },
  {
    title: "Terminal de Grãos (VLI)",
    location: "Santos - SP",
    year: "2023",
    description: "Exploração da logística de exportação e descarga ferroviária de alta performance no maior porto do país.",
    image: "https://placehold.co/800x600/1A1A1A/E84E1B?text=VLI+Santos"
  },
  {
    title: "Oficinas da MRS",
    location: "Jundiaí - SP",
    year: "2024",
    description: "Imersão técnica na manutenção pesada de locomotivas e vagões, com foco em componentes de rodeiros e motores.",
    image: "https://placehold.co/800x600/1A1A1A/E84E1B?text=Oficinas+MRS"
  },
  {
    title: "Vale - EFVM",
    location: "Vitória - ES",
    year: "2022",
    description: "Visita à Estrada de Ferro Vitória a Minas para conhecer a operação de minério de ferro e o trem de passageiros.",
    image: "https://placehold.co/800x600/1A1A1A/E84E1B?text=EFVM+Vale"
  }
];

export function VisitsGallery() {
  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-[#E84E1B] font-bold tracking-widest text-sm uppercase mb-2 block">Experiências</span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            MEMÓRIAS TÉCNICAS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {PAST_VISITS.map((visit, index) => (
            <AnimatedSection 
              key={index} 
              delay={index * 100}
              className={`group relative overflow-hidden rounded-[32px] bg-[#111] border border-white/5 transition-all duration-500 hover:border-[#E84E1B]/40
                ${index === 0 || index === 3 ? 'md:col-span-7' : 'md:col-span-5'}
              `}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all"
                  style={{ backgroundImage: `url(${visit.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                
                <div className="absolute top-6 left-6">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                    {visit.location}
                  </span>
                </div>
              </div>
              
              <div className="p-10 relative -mt-12">
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-3xl font-black text-white leading-none">
                    {visit.title.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </h3>
                  <span className="text-[#E84E1B] font-black text-5xl leading-none opacity-20 group-hover:opacity-100 transition-opacity">
                    {visit.year.slice(2)}
                  </span>
                </div>
                <p className="text-white/40 leading-relaxed font-medium group-hover:text-white/70 transition-colors">
                  {visit.description}
                </p>
                
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4 text-[#E84E1B] font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  Ver Relatório Técnico →
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
