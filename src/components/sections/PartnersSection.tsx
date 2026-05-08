"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function PartnersSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".partner-logo", {
        opacity: 0,
        scale: 0.8,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#FBFBFB] py-32 border-t border-black/5">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
          Rede de Colaboração
        </span>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-16">
          Parceiros que transformam o setor
        </h2>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          {/* Usando placeholders estilizados para representar logotipos de parceiros */}
          {["ANTT", "DNIT", "VALE", "MRS", "RUMO", "VLI"].map((partner) => (
            <div key={partner} className="partner-logo flex flex-col items-center gap-2 group">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-black/5 rounded-2xl flex items-center justify-center font-black text-xl text-black group-hover:bg-[#E84E1B] group-hover:text-white transition-all duration-300">
                {partner[0]}
               </div>
               <span className="text-[10px] font-bold tracking-tighter text-black/40 group-hover:text-[#E84E1B] transition-colors">
                {partner}
               </span>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-white rounded-[40px] border border-black/5 shadow-sm max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-[#E84E1B]/10 rounded-full flex items-center justify-center shrink-0">
             <svg className="w-10 h-10 text-[#E84E1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-bold text-black mb-2">Conexão com a UFSC</h3>
            <p className="text-black/50 leading-relaxed">
              Mantemos parcerias estratégicas com os principais órgãos reguladores e concessionárias de ferrovias do país, garantindo que nossos alunos estejam na fronteira do conhecimento e do mercado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
