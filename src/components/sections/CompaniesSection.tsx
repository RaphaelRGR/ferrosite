"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const COMPANIES = ["RUMO", "MRS", "VLI", "VALE", "ANPTrilhos"];
const COMPANIES_LOOP = [...COMPANIES, ...COMPANIES];

export function CompaniesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      if (!trackRef.current) return;

      // Pegamos 50% da largura (que é a largura dos itens originais)
      const trackWidth = trackRef.current.scrollWidth / 2;

      tweenRef.current = gsap.to(trackRef.current, {
        x: `-=${trackWidth}`,
        duration: 20,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % trackWidth)
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = () => tweenRef.current?.pause();
  const handleMouseLeave = () => tweenRef.current?.play();

  return (
    <section ref={containerRef} className="bg-[#0A0A0A] py-20 md:py-28 border-t border-[#2E2E2E] overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 relative flex flex-col items-center">
        
        {/* Máscara de gradiente para suavizar bordas */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

        <AnimatedSection className="w-full relative overflow-visible flex items-center justify-center">
          <div 
            ref={trackRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="flex flex-nowrap items-center gap-6 will-change-transform"
          >
            {COMPANIES_LOOP.map((name, idx) => (
              <div 
                key={`${name}-${idx}`} 
                className="bg-[#2E2E2E] border border-[#3A3A3A] whitespace-nowrap rounded-[6px] px-8 py-4 text-white font-medium text-sm transition-all duration-150 hover:border-[#E84E1B] hover:text-[#E84E1B] cursor-default"
              >
                {name}
              </div>
            ))}
          </div>
        </AnimatedSection>
        
        <p className="text-center mt-16 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          Empresas parceiras e destinos de egressos
        </p>
      </div>
    </section>
  );
}
