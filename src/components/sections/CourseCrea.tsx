"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CourseCrea() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".crea-content", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
      
      gsap.from(".crea-badge", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
        scale: 0.8,
        opacity: 0,
        rotation: -5,
        duration: 1,
        delay: 0.2,
        ease: "back.out(1.5)"
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Detalhe de fundo */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)' }} />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          
          {/* Brilho decorativo no card */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E84E1B]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="crea-content flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E84E1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <span className="text-white/60 font-bold tracking-widest text-sm uppercase">Atribuição Profissional</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
              O PESO DA <br/>
              <span className="text-[#E84E1B]">ENGENHARIA MECÂNICA</span>
            </h2>
            
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl">
              Nossos egressos não têm restrições. A estrutura da matriz curricular confere dupla atribuição no CREA/CONFEA, integrando os profissionais à Câmara de Engenharia Mecânica e Metalúrgica (Art. 12 da Resolução 218/73).
            </p>

            <ul className="space-y-4">
              {[
                "Projetos mecânicos, termodinâmicos e de fluidos",
                "Responsabilidade técnica em plantas industriais",
                "Peritagem e emissão de laudos de engenharia",
                "Especialidade adicional restrita em operação e via ferroviária"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80 font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E84E1B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="crea-badge w-full md:w-1/3 flex justify-center items-center">
            {/* Visualização abstrata do CREA / Badge */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-dashed border-[#E84E1B]/30 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 border border-[#E84E1B]/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-8 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl">
                <span className="text-4xl font-black text-white tracking-tighter">CREA</span>
                <span className="text-xs font-bold text-[#E84E1B] tracking-widest mt-1">PLENITUDE</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
