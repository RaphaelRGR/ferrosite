"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const NEWS_LIST = [
  {
    id: 1,
    category: "Educação",
    date: "08 Mai",
    title: "Novos laboratórios de sinalização são inaugurados no CTJ.",
    desc: "A estrutura conta com simuladores de última geração para treinamento de sistemas de controle."
  },
  {
    id: 2,
    category: "Mercado",
    date: "05 Mai",
    title: "Setor ferroviário prevê contratação recorde de engenheiros.",
    desc: "Com o novo marco legal das ferrovias, empresas buscam profissionais especializados para projetos de expansão."
  },
  {
    id: 3,
    category: "Comunidade",
    date: "02 Mai",
    title: "Projeto Cavalos de Ferro recebe patrocínio da Rumo.",
    desc: "A parceria fortalecerá a participação da equipe na competição nacional deste ano."
  },
  {
    id: 4,
    category: "Tecnologia",
    date: "28 Abr",
    title: "Alunos desenvolvem sensor IoT para monitoramento de trilhos.",
    desc: "A solução de baixo custo permite identificar fissuras precocemente usando inteligência artificial."
  },
  {
    id: 5,
    category: "Evento",
    date: "25 Abr",
    title: "I Simpósio de Ferrovias Sustentáveis reúne especialistas.",
    desc: "O evento discutiu os desafios da descarbonização no transporte pesado sobre trilhos."
  },
  {
    id: 6,
    category: "Educação",
    date: "20 Abr",
    title: "Pós-graduação em Engenharia de Via Permanente abre inscrições.",
    desc: "O curso é focado na formação prática de especialistas em manutenção e construção ferroviária."
  }
];

export function NewsGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".news-card", {
        y: 60,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-[#0A0A0A] py-32">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Arquivo de <span className="text-white/20">Notícias</span>
           </h2>
           <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-[#E84E1B] transition-all">←</button>
              <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-[#E84E1B] transition-all">→</button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
          {NEWS_LIST.map((news) => (
            <article key={news.id} className="news-card group cursor-pointer border-t border-white/5 pt-8">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[#E84E1B] text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#E84E1B]/5 rounded-full">
                     {news.category}
                  </span>
                  <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                     {news.date}
                  </span>
               </div>
               
               <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#E84E1B] transition-colors leading-tight">
                  {news.title}
               </h3>
               
               <p className="text-white/40 text-sm leading-relaxed mb-8 line-clamp-3">
                  {news.desc}
               </p>

               <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  Ler Reportagem <span>→</span>
               </div>
            </article>
          ))}
        </div>

        <div className="mt-32 flex justify-center">
           <button className="px-10 py-4 border border-white/10 rounded-full text-white text-xs font-black uppercase tracking-widest hover:border-[#E84E1B] hover:text-[#E84E1B] transition-all">
              Carregar mais notícias
           </button>
        </div>
      </div>
    </section>
  );
}
