"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const METRICS = [
  { id: 1, target: 1,     format: (v: number) => `${Math.round(v)}º`,                                       description: "Curso focado em Engenharia Ferroviária no Brasil" },
  { id: 2, target: 103,   format: (v: number) => `R$ ${Math.round(v)} Bi`,                                 description: "Previstos no Novo PAC para obras em ferrovias" },
  { id: 3, target: 30000, format: (v: number) => `+${Math.round(v).toLocaleString("pt-BR")} km`,              description: "De malha ferroviária em expansão e modernização no país" },
  { id: 4, target: 15,    format: (v: number) => `${Math.round(v)} anos`,                                   description: "De tradição formando a elite técnica do setor (desde 2009)" },
];

/**
 * NumbersSection — animação de contador nativa (sem gsap).
 */
export function NumbersSection() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-y-12 text-center sm:grid-cols-4 sm:divide-x sm:divide-[#E0E0E0]">
          {METRICS.map((metric, index) => (
            <AnimatedSection key={metric.id} delay={index * 150} className="flex flex-col items-center px-2 sm:px-4">
              <Counter target={metric.target} format={metric.format} />
              <dt className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#444444] leading-relaxed max-w-[120px] sm:max-w-[140px]">
                {metric.description}
              </dt>
            </AnimatedSection>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Counter({ target, format }: { target: number, format: (v: number) => string }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const start = 0;
        const end = target;
        const duration = 2000;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const currentCount = progress * (end - start) + start;
          setCount(currentCount);
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <dd 
      ref={elementRef}
      className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] mb-2"
    >
      {format(count)}
    </dd>
  );
}
