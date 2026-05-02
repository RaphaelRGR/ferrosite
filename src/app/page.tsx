"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { HeroSection } from "@/components/sections/HeroSection";
import { ManifestoSection } from "@/components/sections/ManifestoSection";
import { NumbersSection } from "@/components/sections/NumbersSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { VisitsSection } from "@/components/sections/VisitsSection";
import { EventsSection } from "@/components/sections/EventsSection";
import { CompaniesSection } from "@/components/sections/CompaniesSection";
import { CtaSection } from "@/components/sections/CtaSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="relative bg-[#0A0A0A] text-white overflow-x-hidden">
      
      {/* HERO FIXED NO FUNDO */}
      <HeroSection />
      
      {/* 
        EFEITO GAVETA (iOS SHEET):
        Todo o restante do site é um bloco sólido com bordas arredondadas no topo
        que desliza fisicamente por cima do Hero.
      */}
      <div className="relative z-20 -mt-[12vh] rounded-t-[40px] md:rounded-t-[80px] bg-[#0A0A0A] shadow-[0_-30px_80px_rgba(0,0,0,0.8)] border-t border-white/5">
        
        {/* Glow sutil na borda da gaveta para destacar a sobreposição */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[40px] bg-[#E84E1B] blur-[60px] opacity-20 pointer-events-none" />

        <ManifestoSection />
        <NumbersSection />
        <AboutSection />
        <HowItWorksSection />
        <VisitsSection />
        <EventsSection />
        <CompaniesSection />
        <CtaSection />
        
      </div>
    </main>
  );
}