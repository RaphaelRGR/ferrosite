"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

export function NewsFeatured() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".featured-card", {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0A0A0A] py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="featured-card relative group cursor-pointer overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm">
           <div className="grid grid-cols-1 lg:grid-cols-2">
              
              {/* Imagem (Placeholder) */}
              <div className="relative h-[400px] lg:h-auto overflow-hidden">
                 <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-white/5 text-[15rem] font-black group-hover:scale-110 transition-transform duration-1000">📰</span>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent lg:hidden" />
              </div>

              {/* Conteúdo */}
              <div className="p-10 md:p-20 flex flex-col justify-center">
                 <div className="flex items-center gap-4 mb-6">
                    <span className="bg-[#E84E1B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                       Destaque
                    </span>
                    <span className="text-white/30 text-xs font-bold uppercase tracking-widest">
                       12 Maio, 2026
                    </span>
                 </div>
                 
                 <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 group-hover:text-[#E84E1B] transition-colors leading-[0.9]">
                    UFSC Joinville lidera pesquisa sobre hidrogênio verde em trens.
                 </h2>
                 
                 <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl">
                    Um projeto inovador que visa substituir motores diesel por células de combustível a hidrogênio está sendo desenvolvido no CTJ, prometendo revolucionar a sustentabilidade na logística nacional.
                 </p>

                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                       RG
                    </div>
                    <div className="flex flex-col">
                       <span className="text-white font-bold text-sm">Raphael Garcia</span>
                       <span className="text-white/30 text-xs uppercase tracking-widest">Editor Chefe</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </section>
  );
}
