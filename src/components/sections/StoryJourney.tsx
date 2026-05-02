"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STATIONS = [
  {
    year: "04 Agosto 2009",
    title: "O Pioneirismo do Curso",
    description: "Criado através do programa REUNI, o curso de Engenharia Ferroviária e Metroviária inicia suas atividades na inauguração do campus de Joinville da UFSC. Fomos o primeiro curso do Brasil focado exclusivamente em formar a elite técnica para o setor ferroviário.",
    align: "left"
  },
  {
    year: "2013 / 2014",
    title: "Os Primeiros Engenheiros do Brasil",
    description: "A formatura da primeira turma é um marco histórico. Marcos Imhof se torna oficialmente o primeiro Engenheiro Ferroviário graduado do país pela nossa instituição, abrindo as portas do mercado nacional para os futuros egressos.",
    align: "right"
  },
  {
    year: "2023",
    title: "Excelência Científica",
    description: "Nossos alunos começam a dominar premiações fora do estado. Projetos de pesquisa do curso ganham destaque nacional, como a premiação de melhor trabalho no Encontro de Física do renomado ITA (Instituto Tecnológico de Aeronáutica).",
    align: "left"
  },
  {
    year: "2024",
    title: "O Reconhecimento da Indústria",
    description: "A UFSC Joinville é indicada como Melhor Instituição de Ensino no Prêmio Revista Ferroviária. No mesmo ano, egressos do curso faturam o Prêmio Inovação da ANTT por projetos revolucionários implantados em gigantes como a Rumo Logística.",
    align: "right"
  },
  {
    year: "O Presente",
    title: "Projeto Comunica Ferro",
    description: "Nascido para furar a bolha acadêmica e dar voz às ferrovias no Brasil. Através de uma estratégia agressiva de comunicação e do nosso Instagram oficial, o projeto não apenas conquistou milhares de inscritos, mas reacendeu o orgulho e o debate sobre o futuro logístico da nação.",
    align: "left"
  },
  {
    year: "O Futuro",
    title: "A Conquista do FerroLab",
    description: "Nossa próxima grande fronteira é o FerroLab: um laboratório robusto operando de dentro de um container real. O objetivo é tirar a teoria da sala de aula e colocar nossos engenheiros em contato direto com os desafios brutos da infraestrutura ferroviária.",
    align: "right"
  }
];

export function StoryJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const trainRef = useRef<HTMLDivElement>(null);
  const stationsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // 1. Animação do Trem descendo os trilhos
      if (trackRef.current && trainRef.current) {
        // Altura total do trilho menos a altura do trem
        gsap.to(trainRef.current, {
          y: () => trackRef.current!.offsetHeight - trainRef.current!.offsetHeight,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top center", // Começa a mover quando o container chega no meio da tela
            end: "bottom center", // Termina de mover quando o container passa
            scrub: true,
          }
        });
      }

      // 2. Animação de revelação de cada estação
      stationsRef.current.forEach((station, index) => {
        if (!station) return;
        
        const isLeft = STATIONS[index].align === "left";

        gsap.fromTo(
          station,
          { opacity: 0, x: isLeft ? -50 : 50, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: station,
              start: "top 60%", // A estação acende quando chega a 60% da tela (junto com o trem)
              end: "top 40%",
              toggleActions: "play none none reverse", // Se subir, apaga de novo
            }
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-[#0A0A0A] py-32 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 relative">
        
        {/* Título da Seção */}
        <div className="text-center mb-32 relative z-10">
          <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
            A Nossa História
          </span>
          <h2 className="text-4xl font-black text-white tracking-tighter sm:text-5xl lg:text-6xl">
            Uma Jornada de Inovação
          </h2>
        </div>

        {/* Container do Trilho Central */}
        <div className="relative min-h-[1200px] md:min-h-[1000px] flex flex-col justify-between py-20">
          
          {/* A Linha do Trilho (Visual) */}
          <div 
            ref={trackRef} 
            className="absolute top-0 bottom-0 left-[24px] md:left-1/2 w-1 bg-gradient-to-b from-transparent via-[#3A3A3A] to-transparent -translate-x-1/2 rounded-full"
          >
            {/* Detalhe de trilhos (pontos) */}
            <div className="absolute top-0 bottom-0 w-full flex flex-col justify-around items-center opacity-30">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-[2px] bg-[#E84E1B]" />
              ))}
            </div>
          </div>

          {/* O Trem SVG que vai deslizar sobre o trilho */}
          <div 
            ref={trainRef} 
            className="absolute top-0 left-[24px] md:left-1/2 -translate-x-1/2 z-20 w-12 h-12 bg-[#1A1A1A] rounded-full border-2 border-[#E84E1B] flex items-center justify-center shadow-[0_0_20px_rgba(232,78,27,0.4)] will-change-transform"
          >
            {/* Ícone de Trem 2D (Frontal) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="16" rx="2" ry="2"/>
              <path d="M4 11h16"/>
              <path d="M12 3v8"/>
              <path d="M8 19l-2 3"/>
              <path d="M16 19l2 3"/>
              <circle cx="9" cy="15" r="1"/>
              <circle cx="15" cy="15" r="1"/>
            </svg>
          </div>

          {/* As Estações (Conteúdo) */}
          <div className="relative z-10 space-y-32">
            {STATIONS.map((station, index) => {
              const isLeft = station.align === "left";
              
              return (
                <div 
                  key={index}
                  ref={(el) => { stationsRef.current[index] = el; }}
                  className={`flex flex-col md:flex-row w-full ${isLeft ? 'justify-start' : 'justify-end'} pl-16 md:pl-0`}
                >
                  <div className={`md:w-5/12 relative ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                    
                    {/* Estação (Ponto no trilho visível no Desktop) */}
                    <div className={`hidden md:block absolute top-6 w-4 h-4 rounded-full bg-[#1A1A1A] border-2 border-white z-10 ${isLeft ? 'right-[-8px]' : 'left-[-8px]'}`} />

                    <div className="bg-[#111111] border border-white/5 p-8 rounded-2xl hover:border-[#E84E1B]/50 transition-colors duration-300 shadow-xl relative overflow-hidden group">
                      
                      {/* Brilho interno do card */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#E84E1B] to-transparent opacity-0 blur group-hover:opacity-10 transition duration-500" />
                      
                      <div className="relative z-10">
                        <span className="text-[#E84E1B] font-mono text-sm font-bold mb-3 block">
                          {station.year}
                        </span>
                        <h3 className="text-2xl font-bold text-white mb-4">
                          {station.title}
                        </h3>
                        <p className="text-white/60 leading-relaxed text-lg">
                          {station.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
