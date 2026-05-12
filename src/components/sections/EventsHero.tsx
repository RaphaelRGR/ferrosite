"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function EventsHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      });
      gsap.from(subtitleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });
      
      // Animação das partículas de fundo
      gsap.to(".bg-particle", {
        y: "random(-100, 100)",
        x: "random(-100, 100)",
        duration: "random(10, 20)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.1
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A] pt-32 pb-20">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E84E1B] blur-[150px] opacity-10 rounded-full" />
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="bg-particle absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <span className="inline-block px-4 py-1.5 mb-6 border border-[#E84E1B]/30 rounded-full bg-[#E84E1B]/5 text-[#E84E1B] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
          Calendário 2026
        </span>
        <h1 ref={titleRef} className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
          CONECTANDO O <br />
          <span className="text-[#E84E1B]">FUTURO</span> DA FERROVIA
        </h1>
        <p ref={subtitleRef} className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          De competições internacionais a workshops técnicos, participe dos eventos que definem a nova geração da engenharia ferroviária no Brasil.
        </p>
      </div>

      {/* Indicador de Scroll */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        <span className="text-[10px] uppercase tracking-widest text-white">Scroll</span>
      </div>
    </section>
  );
}
