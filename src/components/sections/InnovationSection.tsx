"use client";

import { useRef } from "react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function InnovationSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="bg-white pt-24 md:pt-32 pb-12 md:pb-16 relative overflow-hidden">
      {/* Elementos decorativos sutis */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-1/4 pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center mb-16 md:mb-20">
          <div className="max-w-2xl">
            <span className="text-[#E84E1B] font-bold tracking-[0.2em] uppercase text-[10px] mb-6 block border-l-2 border-[#E84E1B] pl-4">
              Tecnologia e Futuro
            </span>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-black leading-[0.9] mb-8">
              Acelerando a <br />
              <span className="text-[#E84E1B]">Inovação nos Trilhos</span>
            </h2>
            <p className="text-black/60 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              Desenvolvemos soluções de alta tecnologia para os desafios reais da infraestrutura ferroviária brasileira, unindo engenharia de ponta e pesquisa acadêmica.
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-black">15+</span>
                <span className="text-[10px] uppercase font-bold text-black/40 tracking-widest">Projetos Ativos</span>
              </div>
              <div className="w-px h-12 bg-black/10 mx-4" />
              <div className="flex flex-col">
                <span className="text-3xl font-black text-black">UFSC</span>
                <span className="text-[10px] uppercase font-bold text-black/40 tracking-widest">Excelência Acadêmica</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-[#E84E1B]/5 rounded-[40px] scale-95 group-hover:scale-100 transition-transform duration-700" />
            <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden border border-black/5 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1515165599668-759998240ce9?auto=format&fit=crop&q=80&w=1200" 
                alt="Tecnologia Ferroviária"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute bottom-8 left-8 z-20">
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl">
                  <p className="text-xs font-black uppercase tracking-widest text-[#E84E1B] mb-1">Laboratório de Inovação</p>
                  <p className="text-sm font-bold text-black">Centro Tecnológico de Joinville</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              title: "Sistemas Autônomos",
              desc: "Pesquisa em sinalização inteligente e controle de tráfego automatizado para maior eficiência.",
              icon: "01"
            },
            {
              title: "Manutenção Preditiva",
              desc: "Algoritmos de IA para análise de fadiga em trilhos, reduzindo custos e prevenindo acidentes.",
              icon: "02"
            },
            {
              title: "Energia Sustentável",
              desc: "Estudo de novas matrizes energéticas e eletrificação de malhas ferroviárias de baixo carbono.",
              icon: "03"
            }
          ].map((item, i) => (
            <AnimatedSection key={i} delay={i * 100}>
              <div className="group bg-slate-50/50 border border-black/5 p-8 md:p-10 rounded-[40px] hover:bg-white hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-default h-full">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 group-hover:bg-[#E84E1B] group-hover:text-white transition-all duration-500">
                  <span className="font-black text-sm">{item.icon}</span>
                </div>
                <h3 className="text-xl font-black text-black mb-4 tracking-tight">{item.title}</h3>
                <p className="text-black/50 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
