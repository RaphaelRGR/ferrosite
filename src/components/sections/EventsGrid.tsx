"use client";

import { useRef, MouseEvent } from "react";
import gsap from "gsap";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: "HackFerro 2026",
    date: "Setembro",
    category: "Inovação",
    desc: "Maratona de programação voltada para desafios logísticos e operacionais do setor metroferroviário.",
    icon: "💻"
  },
  {
    id: 2,
    title: "Simpósio Sul de Ferrovias",
    date: "Outubro",
    category: "Acadêmico",
    desc: "Apresentação de artigos científicos e palestras com especialistas do mercado sobre o futuro dos trilhos.",
    icon: "📚"
  },
  {
    id: 3,
    title: "Visita Técnica: Rumo Logística",
    date: "Novembro",
    category: "Técnico",
    desc: "Imersão prática no centro de controle operacional e oficinas de manutenção da maior concessionária do país.",
    icon: "🚂"
  },
  {
    id: 4,
    title: "Workshop: Sinalização ERTMS",
    date: "Dezembro",
    category: "Formação",
    desc: "Treinamento intensivo sobre o sistema europeu de gerenciamento de tráfego ferroviário.",
    icon: "📡"
  }
];

export function EventsGrid() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1000,
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <section className="bg-[#0A0A0A] py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
              Próximos Encontros
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              Agenda <span className="text-white/20">Completa</span>
            </h2>
          </div>
          <div className="flex gap-4">
             {["Todos", "Técnicos", "Sociais"].map((filter) => (
                <button key={filter} className="px-6 py-2 rounded-full border border-white/10 text-xs font-bold text-white/40 hover:text-white hover:border-[#E84E1B] transition-all">
                  {filter}
                </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {UPCOMING_EVENTS.map((event, i) => (
            <AnimatedSection key={event.id} delay={i * 150}>
              <div 
                ref={(el) => { cardsRef.current[i] = el; }}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onMouseLeave={() => handleMouseLeave(i)}
                className="group relative bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/10 hover:border-[#E84E1B]/40 transition-all duration-500 cursor-pointer h-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="flex justify-between items-start mb-8" style={{ transform: "translateZ(30px)" }}>
                   <div className="w-14 h-14 bg-[#E84E1B]/10 rounded-2xl flex items-center justify-center text-3xl">
                      {event.icon}
                   </div>
                   <span className="text-[10px] font-black text-[#E84E1B] uppercase tracking-widest bg-[#E84E1B]/5 px-3 py-1 rounded-full border border-[#E84E1B]/20">
                      {event.category}
                   </span>
                </div>

                <div style={{ transform: "translateZ(40px)" }}>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#E84E1B] transition-colors">{event.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-8">{event.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5" style={{ transform: "translateZ(20px)" }}>
                   <div className="flex flex-col">
                      <span className="text-white/30 text-[10px] uppercase font-black">Previsão</span>
                      <span className="text-white font-bold">{event.date}</span>
                   </div>
                   <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                      →
                   </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

      </div>
    </section>
  );
}
