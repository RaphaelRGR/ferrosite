"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

const UPCOMING_VISITS = [
  {
    local: "RUMO Logística",
    date: "18 Jun 2026",
    details: "Visita ao CCO e oficinas em Curitiba. Foco em sistemas de controle e material rodante.",
    status: "CONFIRMADA",
    type: "Técnica"
  },
  {
    local: "UTN - Buenos Aires",
    date: "Jul 2026",
    details: "Missão Internacional: Estudo da rede metroviária argentina e intercâmbio acadêmico.",
    status: "CONFIRMADA",
    type: "Internacional"
  },
  {
    local: "VLI Logística",
    date: "Set 2026",
    details: "Terminal Integrador Portuário (TIP) em Santos. Logística de exportação.",
    status: "PLANEJAMENTO",
    type: "Técnica"
  },
  {
    local: "Vale - EFVM",
    date: "Nov 2026",
    details: "Imersão técnica na operação de minério e Trem de Passageiros.",
    status: "PLANEJAMENTO",
    type: "Imersão"
  }
];

export function VisitsSchedule() {
  return (
    <section className="py-24 bg-[#0A0A0A] border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16 text-center">
          <span className="text-[#E84E1B] font-bold tracking-widest text-sm uppercase mb-2 block">Cronograma</span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            PRÓXIMAS EMBARQUES
          </h2>
        </div>

        <div className="space-y-6">
          {UPCOMING_VISITS.map((visit, index) => (
            <AnimatedSection 
              key={index} 
              delay={index * 100}
              className="group relative bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-[#E84E1B]/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${
                      visit.status === 'CONFIRMADA' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-[#E84E1B]'
                    }`}>
                      {visit.status}
                    </span>
                    <span className="text-white/20 text-xs font-bold uppercase tracking-widest">{visit.type}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{visit.local}</h3>
                  <p className="text-gray-400 font-medium">
                    {visit.details}
                  </p>
                </div>
                
                <div className="text-left md:text-right flex flex-col justify-center">
                  <span className="text-[#E84E1B] text-3xl font-black tracking-tighter">{visit.date}</span>
                  <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Data prevista</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-[#E84E1B]/10 to-transparent border border-[#E84E1B]/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h4 className="text-xl font-bold text-white mb-2">Interessado em participar?</h4>
              <p className="text-gray-400">
                As inscrições para visitas técnicas são exclusivas para alunos do curso e abrem geralmente 30 dias antes da data prevista.
              </p>
            </div>
            <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-[#E84E1B] hover:text-white transition-all whitespace-nowrap">
              Ver Edital de Seleção
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
