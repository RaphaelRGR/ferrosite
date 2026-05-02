"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PILLARS = [
  {
    id: "mecanica",
    title: "Material Rodante",
    subtitle: "A Força Motriz",
    desc: "Projetamos o coração das ferrovias. De truques superestruturados a locomotivas diesel-elétricas que tracionam 15.000 toneladas, tudo passa pela engenharia mecânica pesada.",
    bgClass: "bg-[#253B59]",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
    )
  },
  {
    id: "infra",
    title: "Via Permanente",
    subtitle: "A Base Operacional",
    desc: "A infraestrutura perfeita é invisível até falhar. Estudamos a geotecnia, o dimensionamento de trilhos, lastros e dormentes para suportar o impacto implacável do transporte em massa.",
    bgClass: "bg-[#592D25]",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"/><path d="M10 22V6a2 2 0 0 0-2-2H4"/><path d="M14 22V6a2 2 0 0 1 2-2h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
    )
  },
  {
    id: "controle",
    title: "Sinalização",
    subtitle: "O Cérebro da Malha",
    desc: "Como evitar que dois trens de carga colidam a 80km/h? Desenvolvemos os sistemas embarcados e telecomunicações (PTC, CBTC) que garantem a segurança ativa da via.",
    bgClass: "bg-[#204033]",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m5 10 7-7 7 7"/><path d="M5 14l7 7 7-7"/></svg>
    )
  },
  {
    id: "logistica",
    title: "Logística",
    subtitle: "A Eficiência Total",
    desc: "Ferrovia é o negócio de mover volumes gigantescos pelo menor custo. Aprendemos a otimizar rotas, consumo de combustível e a economia complexa por trás do frete nacional.",
    bgClass: "bg-[#3D2559]",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
    )
  }
];

const STAIRS = ["lg:translate-y-0", "lg:translate-y-8", "lg:translate-y-16", "lg:translate-y-24"];

export function CoursePillars() {
  const [active, setActive] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (active !== null) {
        setActive(null);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [active]);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Animação de entrada
      gsap.fromTo(".pillar-card", 
        { y: 80, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: "power4.out",
        }
      );

      let mm = gsap.matchMedia();
      mm.add("(max-width: 1023px)", () => {
        PILLARS.forEach((pillar, index) => {
          ScrollTrigger.create({
            trigger: cardsRef.current[index],
            start: "top center+=100",
            end: "bottom center-=100",
            onToggle: (self) => {
              if (self.isActive) setActive(pillar.id);
            }
          });
        });
      });
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  // Nova animação suave de expansão controlada pelo GSAP
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) return;

    PILLARS.forEach((pillar, index) => {
      const card = cardsRef.current[index];
      const isActive = active === pillar.id;
      const isAnyActive = active !== null;

      if (card) {
        gsap.to(card, {
          flexGrow: isAnyActive ? (isActive ? 3 : 1) : 1,
          y: isAnyActive ? 0 : (index * 32),
          duration: 0.7,
          ease: "power4.out",
        });
      }
    });
  }, [active]);

  return (
    <section ref={sectionRef} className="pt-24 pb-40 bg-[#0A0A0A] border-t border-white/5 relative overflow-hidden z-[100]">
      <div className="max-w-7xl mx-auto px-6 relative z-[110]">
        
        <div className="mb-16">
          <span className="text-[#E84E1B] font-bold tracking-widest text-sm uppercase mb-2 block">Fundamentos</span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            OS 4 PILARES DA FORMAÇÃO
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[620px] items-start">
          {PILLARS.map((pillar, index) => {
            const isActive = active === pillar.id;
            
            return (
              <div 
                key={pillar.id}
                ref={(el) => { if (el) cardsRef.current[index] = el; }}
                onMouseEnter={() => setActive(pillar.id)}
                onClick={() => setActive(pillar.id)}
                className={`pillar-card group relative z-50 overflow-hidden rounded-3xl cursor-pointer flex flex-col justify-end p-8 border transition-colors duration-500 h-full lg:h-[500px]
                  ${isActive ? `${pillar.bgClass} border-white/20 shadow-2xl` : 'bg-[#1A1A1A] border-white/5'}
                `}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  flexBasis: '0%',
                  flexGrow: 1
                }}
              >
                <div className="relative z-10 flex flex-col h-full justify-between pointer-events-none">
                  <div className={`p-4 rounded-xl w-fit transition-all duration-700 ease-out
                    ${isActive 
                      ? 'bg-white text-black scale-110 shadow-lg' 
                      : 'bg-white/10 text-white'}`}
                  >
                    {pillar.icon}
                  </div>
                  
                  <div className="mt-8">
                    <p className={`text-xs font-black uppercase tracking-[0.2em] mb-4 transition-colors duration-700
                      ${isActive ? 'text-white/90' : 'text-white/40'}`}>
                      {pillar.subtitle}
                    </p>
                    <h3 className={`font-black text-white transition-all duration-700 tracking-tighter 
                      ${isActive ? 'text-4xl lg:text-5xl mb-6' : 'text-xl lg:text-2xl'}`}>
                      {pillar.title}
                    </h3>
                    
                    <div className={`overflow-hidden transition-all duration-700
                      ${isActive ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                      <p className="text-white leading-relaxed text-base md:text-lg font-medium antialiased">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
