"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MANIFESTO_TEXT = "R$ 600 bilhões em investimentos previstos para o setor ferroviário brasileiro.";
const MANIFESTO_SUB = "Os engenheiros que vão executar isso estão sendo formados agora, no CTJ.";

export function ManifestoSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      if (!textRef.current) return;
      const spans = textRef.current.querySelectorAll("span");

      gsap.to(spans, {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "bottom 40%",
          scrub: 1,
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const words = MANIFESTO_TEXT.split(" ");

  return (
    <section ref={containerRef} className="bg-transparent py-20 md:py-28 relative">
      <AnimatedSection className="mx-auto max-w-5xl px-6 text-center relative z-10">
        <h3 ref={textRef} className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl mb-8 drop-shadow-xl flex flex-wrap justify-center gap-x-3 gap-y-2">
          {words.map((word, i) => (
            <span key={i} className="opacity-[0.15] will-change-[opacity]">
              {word}
            </span>
          ))}
        </h3>
        <p className="text-white opacity-80 text-lg md:text-xl font-medium tracking-wide drop-shadow-md">
          {MANIFESTO_SUB}
        </p>
      </AnimatedSection>
    </section>
  );
}
