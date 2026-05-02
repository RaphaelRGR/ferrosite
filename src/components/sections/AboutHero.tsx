"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AboutHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Efeito Parallax no fundo
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Reveal do título
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.5, ease: "power4.out", delay: 0.5 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Imagem de Fundo com Parallax */}
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 scale-110"
        style={{
          backgroundImage: 'url("/images/about/hero-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 text-center px-6">
        <span className="text-[#E84E1B] font-bold tracking-[0.3em] uppercase text-xs mb-6 block">
          Nossa História & Propósito
        </span>
        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white max-w-5xl mx-auto leading-[0.9]"
        >
          A Engenharia que <br /> <span className="text-white/40">Transforma o Brasil</span>
        </h1>
      </div>
      
      {/* Glow de transição na base */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent z-20" />
    </section>
  );
}
