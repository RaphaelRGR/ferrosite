"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutHero() {
  return (
    <section className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Imagem de Fundo com Parallax via CSS */}
      <div 
        className="absolute inset-0 z-0 scale-110"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          // Efeito parallax básico via CSS
          transform: "translateY(var(--scroll-y, 0))",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 text-center px-6">
        <AnimatedSection delay={200}>
          <span className="text-[#E84E1B] font-bold tracking-[0.3em] uppercase text-xs mb-6 block">
            Nossa História & Propósito
          </span>
        </AnimatedSection>
        
        <AnimatedSection delay={400} translateY="translate-y-12">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white max-w-5xl mx-auto leading-[0.9]">
            A Engenharia que <br /> <span className="text-white/40">Transforma o Brasil</span>
          </h1>
        </AnimatedSection>
      </div>
      
      {/* Glow de transição na base */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent z-20" />
    </section>
  );
}
