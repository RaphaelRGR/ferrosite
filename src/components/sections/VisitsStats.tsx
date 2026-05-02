"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

const STATS = [
  { label: "Visitas Realizadas", value: "48+" },
  { label: "Empresas Parceiras", value: "15" },
  { label: "Alunos Impactados", value: "1.2k" },
  { label: "Países Visitados", value: "03" },
];

export function VisitsStats() {
  return (
    <section className="py-20 bg-[#0A0A0A] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <AnimatedSection 
              key={index} 
              delay={index * 100}
              className="text-center"
            >
              <div className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
                {stat.value}
              </div>
              <div className="text-[#E84E1B] text-xs font-bold uppercase tracking-widest opacity-80">
                {stat.label}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
