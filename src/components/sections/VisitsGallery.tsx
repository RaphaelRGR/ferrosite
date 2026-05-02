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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PAST_VISITS.map((visit, index) => (
            <AnimatedSection 
              key={index} 
              delay={index * 100}
              className="group relative overflow-hidden rounded-3xl bg-[#1A1A1A] border border-white/5"
            >
              <div className="aspect-[16/9] w-full bg-[#111] overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60 grayscale hover:grayscale-0 transition-all"
                  style={{ backgroundImage: `url(${visit.image})` }}
                />
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[#E84E1B] text-xs font-bold uppercase tracking-widest">{visit.location}</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{visit.title}</h3>
                  </div>
                  <span className="text-white/20 font-black text-3xl">{visit.year}</span>
                </div>
                <p className="text-gray-400 leading-relaxed font-medium">
                  {visit.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
