"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function VisitsHero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2 }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#E84E1B15,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60L60 0M-10 10L10 -10M50 70L70 50' stroke='white' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl">
        <span 
          ref={subtitleRef}
          className="inline-block text-[#E84E1B] text-sm font-black tracking-[0.4em] uppercase mb-8 opacity-0"
        >
          Experiência em Campo
        </span>
        <h1 
          ref={titleRef}
          className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.9]"
        >
          A VIDA NOS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#E84E1B] to-[#b03a14]">
            TRILHOS
          </span>
        </h1>
        <div className="w-24 h-[1px] bg-[#E84E1B] mx-auto mb-10" />
        <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto font-medium leading-relaxed">
          Onde a teoria da sala de aula encontra a magnitude da <span className="text-white">Engenharia Ferroviária</span> real.
        </p>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#E84E1B] to-transparent" />
        <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Scroll</span>
      </div>
    </section>
  );
}
