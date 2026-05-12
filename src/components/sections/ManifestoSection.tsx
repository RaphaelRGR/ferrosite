"use client";

import { useRef, useEffect } from "react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const MANIFESTO_TEXT =
  "R$ 600 bilhões em investimentos previstos para o setor ferroviário brasileiro.";
const MANIFESTO_SUB =
  "Os engenheiros que vão executar isso estão sendo formados agora, no CTJ.";

/**
 * ManifestoSection — sem gsap.
 * Efeito de palavra por palavra via IntersectionObserver + CSS transitions.
 */
export function ManifestoSection() {
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Ativa cada palavra com delay em cascata
            wordsRef.current.forEach((span, i) => {
              if (!span) return;
              setTimeout(() => {
                span.style.opacity = "1";
                span.style.transform = "translateY(0)";
              }, i * 60);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const words = MANIFESTO_TEXT.split(" ");

  return (
    <section ref={sectionRef} className="bg-transparent py-16 sm:py-20 md:py-28 relative">
      <AnimatedSection className="mx-auto max-w-5xl px-4 sm:px-6 text-center relative z-10">
        {/* Título palavra por palavra */}
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white mb-6 sm:mb-8 drop-shadow-xl flex flex-wrap justify-center gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-2">
          {words.map((word, i) => (
            <span
              key={i}
              ref={(el) => { wordsRef.current[i] = el; }}
              className="will-change-[opacity,transform]"
              style={{
                opacity: 0,
                transform: "translateY(8px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              {word}
            </span>
          ))}
        </h3>

        <p className="text-white/70 text-base sm:text-lg md:text-xl font-medium tracking-wide drop-shadow-md max-w-2xl mx-auto">
          {MANIFESTO_SUB}
        </p>
      </AnimatedSection>
    </section>
  );
}
