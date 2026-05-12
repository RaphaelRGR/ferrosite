"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function InnovationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".innovation-card", {
        y: 60,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-32 relative overflow-hidden">
      {/* Elementos decorativos sutis */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F8F9FA] -skew-x-12 translate-x-1/4 pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
              Tecnologia e Futuro
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black leading-none">
              Acelerando a <br />
              <span className="text-[#E84E1B]">Inovação nos Trilhos</span>
            </h2>
          </div>
          <p className="text-black/60 text-lg max-w-md leading-relaxed">
            Desenvolvemos soluções de alta tecnologia para os desafios reais da infraestrutura ferroviária brasileira, unindo engenharia de ponta e pesquisa acadêmica.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Sistemas Autônomos",
              desc: "Pesquisa em sinalização inteligente e controle de tráfego automatizado para maior eficiência e segurança operacional.",
              icon: "01"
            },
            {
              title: "Manutenção Preditiva",
              desc: "Algoritmos de IA para análise de fadiga em trilhos e componentes, reduzindo custos e prevenindo acidentes.",
              icon: "02"
            },
            {
              title: "Energia Sustentável",
              desc: "Estudo de novas matrizes energéticas e eletrificação de malhas ferroviárias para um transporte de baixo carbono.",
              icon: "03"
            }
          ].map((item, i) => (
            <div key={i} className="innovation-card group bg-white border border-black/5 p-10 rounded-[32px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500">
              <span className="text-5xl font-black text-black/5 group-hover:text-[#E84E1B]/10 transition-colors duration-500 mb-6 block">
                {item.icon}
              </span>
              <h3 className="text-2xl font-bold text-black mb-4">{item.title}</h3>
              <p className="text-black/50 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
