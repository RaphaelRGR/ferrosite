"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function NewsHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal-text", {
        y: 80,
        opacity: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: "power4.out",
      });
      
      gsap.to(".scroll-line", {
        scaleY: 0,
        duration: 2,
        repeat: -1,
        ease: "power1.inOut"
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-[60vh] flex flex-col items-center justify-center bg-[#0A0A0A] pt-40 pb-20 overflow-hidden">
      {/* Elementos de fundo editorial */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none select-none">
         <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-white whitespace-nowrap">
            JOURNAL
         </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-8 reveal-text">
          <div className="w-12 h-[1px] bg-[#E84E1B]" />
          <span className="text-[#E84E1B] font-bold tracking-[0.3em] uppercase text-[10px]">
             News & Updates
          </span>
          <div className="w-12 h-[1px] bg-[#E84E1B]" />
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] mb-12 reveal-text">
          O QUE HÁ DE <br />
          <span className="text-[#E84E1B]">NOVO NOS TRILHOS</span>
        </h1>
        
        <div className="flex flex-wrap justify-center gap-6 reveal-text">
           {["Educação", "Tecnologia", "Mercado", "Comunidade"].map((tag) => (
              <span key={tag} className="text-white/30 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors cursor-pointer">
                 {tag}
              </span>
           ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
         <div className="w-[1px] h-16 bg-white/10 relative overflow-hidden">
            <div className="scroll-line absolute inset-0 bg-[#E84E1B] origin-top" />
         </div>
      </div>
    </section>
  );
}
