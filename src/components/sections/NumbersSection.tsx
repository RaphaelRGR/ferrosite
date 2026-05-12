"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const METRICS = [
  { id: 1, target: 1, format: (v: number) => `${Math.round(v)}º`, description: "Curso focado em Engenharia Ferroviária no Brasil" },
  { id: 2, target: 103, format: (v: number) => `R$ ${Math.round(v)} Bi`, description: "Previstos no Novo PAC para obras em ferrovias" },
  { id: 3, target: 30000, format: (v: number) => `+${Math.round(v).toLocaleString("pt-BR")} km`, description: "De malha ferroviária em expansão e modernização no país" },
  { id: 4, start: 0, target: 15, format: (v: number) => `${Math.round(v)} anos`, description: "De tradição formando a elite técnica do setor (desde 2009)" },
];

export function NumbersSection() {
  const containerRef = useRef<HTMLElement>(null);
  const countersRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Sem animação se reduzida
      countersRef.current.forEach((el, index) => {
        if (el) el.innerText = METRICS[index].format(METRICS[index].target);
      });
      return;
    }

    const ctx = gsap.context(() => {
      countersRef.current.forEach((el, index) => {
        if (!el) return;
        const metric = METRICS[index];
        const startValue = metric.start || 0;
        
        const obj = { val: startValue };

        gsap.to(obj, {
          val: metric.target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none none"
          },
          onUpdate: () => {
            if (el) el.innerText = metric.format(obj.val);
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <dl className="grid grid-cols-2 gap-y-16 text-center sm:grid-cols-4 sm:divide-x sm:divide-[#E0E0E0]">
          {METRICS.map((metric, index) => (
            <AnimatedSection key={metric.id} delay={index * 150} className="flex flex-col items-center px-4">
              <dd 
                ref={(el) => { countersRef.current[index] = el; }}
                className="text-5xl font-black tracking-tighter text-[#1A1A1A] mb-2 sm:text-6xl will-change-contents"
              >
                {metric.format(metric.start || 0)}
              </dd>
              <dt className="text-xs font-bold uppercase tracking-widest text-[#444444] leading-relaxed max-w-[140px]">
                {metric.description}
              </dt>
            </AnimatedSection>
          ))}
        </dl>
      </div>
    </section>
  );
}
