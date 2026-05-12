"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CursoHero() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        badgeRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(
        titleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
      );
      gsap.fromTo(
        pRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.4 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-[#0A0A0A] text-white pt-40 pb-24 overflow-hidden flex items-center justify-center min-h-[70vh]">
      {/* Luz ambiente sutil no fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E84E1B]/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        <span 
          ref={badgeRef} 
          className="inline-block px-4 py-1.5 mb-8 text-xs md:text-sm font-bold tracking-[0.2em] text-white/70 uppercase border border-white/10 rounded-full bg-white/5 backdrop-blur-sm"
        >
          Único no Brasil
        </span>
        
        <h1 
          ref={titleRef} 
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1] text-white"
        >
          ENGENHARIA <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
            FERROVIÁRIA
          </span>
        </h1>
        
        <p 
          ref={pRef} 
          className="text-lg md:text-2xl text-white/50 max-w-3xl leading-relaxed font-medium"
        >
          Projetado do zero para dominar a malha logística. Formamos a elite técnica disputada pelas maiores gigantes da infraestrutura do país.
        </p>
      </div>
      
      {/* Linha decorativa inferior indicando que tem mais conteúdo abaixo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-24 bg-gradient-to-b from-[#E84E1B]/0 via-[#E84E1B]/50 to-[#E84E1B]" />
    </section>
  );
}
