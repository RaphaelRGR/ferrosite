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
    <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#E84E1B]/10 to-transparent opacity-50" />
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px"
          }}
        />
      </div>

      <div className="relative z-10 text-center px-6">
        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-6"
        >
          ALÉM DOS <span className="text-[#E84E1B]">TRILHOS</span>
        </h1>
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-medium"
        >
          Vivenciando a engenharia pesada e a logística estratégica nas maiores concessionárias do continente.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E84E1B]/30 to-transparent" />
    </section>
  );
}
