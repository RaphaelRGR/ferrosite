"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

export function FeaturedEvent() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".featured-content > *", {
        x: -50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
        }
      });
      
      gsap.from(".featured-image", {
        scale: 1.1,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0A0A0A] py-24 md:py-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="featured-content order-2 lg:order-1">
            <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
              Evento Principal
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
              Cavalos de Ferro <span className="text-white/20">2026</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              A maior competição estudantil de engenharia ferroviária das Américas. Equipes de todo o continente se reúnem para demonstrar inovação, tecnologia e eficiência em sistemas de transporte sobre trilhos.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <span className="text-white font-bold text-2xl block">01-05</span>
                <span className="text-white/40 text-sm uppercase tracking-wider">Julho 2026</span>
              </div>
              <div>
                <span className="text-white font-bold text-2xl block">Joinville</span>
                <span className="text-white/40 text-sm uppercase tracking-wider">Santa Catarina</span>
              </div>
            </div>

            <button className="group relative px-8 py-4 bg-[#E84E1B] text-white font-black uppercase tracking-widest text-xs rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95">
              <span className="relative z-10">Inscrever Equipe →</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>

          <div className="order-1 lg:order-2">
            <div className="featured-image relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 group">
               {/* Usaremos uma imagem placeholder mas estilizada */}
               <div className="absolute inset-0 bg-gradient-to-tr from-[#E84E1B]/20 to-transparent z-10" />
               <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                  <span className="text-white/10 text-[10rem] font-black group-hover:scale-110 transition-transform duration-700">🏆</span>
               </div>
               
               {/* Label flutuante */}
               <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 z-20">
                  <span className="text-xs font-black text-[#E84E1B] uppercase tracking-widest block mb-2">Edição de Aniversário</span>
                  <p className="text-white/80 text-sm">Comemorando 10 anos de excelência na UFSC Joinville.</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
