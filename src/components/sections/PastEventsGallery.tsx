"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PAST_EVENTS = [
  { id: 1, title: "Semana Acadêmica 2025", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4" },
  { id: 2, title: "Visita Vale Tubarão", image: "https://images.unsplash.com/photo-1541888941259-7a94966f4699" },
  { id: 3, title: "Competição Cavalos de Ferro 2024", image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122" },
  { id: 4, title: "Workshop Sinalização", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" },
];

export function PastEventsGallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".gallery-strip", {
        xPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-[#0A0A0A] py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
          Histórico
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
          Momentos <span className="text-white/20">Memoráveis</span>
        </h2>
      </div>

      <div className="flex gap-8 gallery-strip w-[200%]">
        {[...PAST_EVENTS, ...PAST_EVENTS].map((item, i) => (
          <div key={`${item.id}-${i}`} className="relative w-[400px] md:w-[600px] aspect-video rounded-3xl overflow-hidden group border border-white/5">
             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10" />
             {/* Simulação de imagem com cores e degradê, já que não temos assets reais */}
             <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E84E1B]/10 to-transparent" />
                <span className="text-white/5 text-8xl font-black">{item.id}</span>
             </div>
             
             <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <span className="text-xs font-black text-[#E84E1B] uppercase tracking-widest">Ver Galeria →</span>
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}
