"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const HERO_CONTENT = {
  badge: "Portal não oficial",
  title: "Engenharia Ferroviária",
  subtitle: "e Metroviária · UFSC Joinville",
  description: "O único curso de Santa Catarina. Formando os engenheiros que vão mover o Brasil com tecnologia e inovação.",
  primaryButton: "Explorar Portal",
  secondaryButton: "Conhecer o Curso",
};

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Reveal inicial
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
      );
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );
      gsap.fromTo(
        descRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.4 }
      );
      gsap.fromTo(
        buttonsRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.6 }
      );

      // Parallax Video
      gsap.to(videoRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
      });

      // Fade out content on scroll
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
      });
      
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-[112vh] w-full">
      <section className="sticky top-0 flex h-[100vh] w-full flex-col items-center justify-center overflow-hidden bg-black">
        
        {/* VÍDEO DE FUNDO COM PARALLAX */}
        <div ref={videoRef} className="absolute inset-0 z-0 hidden md:block overflow-hidden pointer-events-none h-[130vh] -top-[15vh] will-change-transform">
          <iframe
            src="https://www.youtube.com/embed/vFH2lGROUI8?autoplay=1&mute=1&loop=1&playlist=vFH2lGROUI8&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&vq=hd1080"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: '177.78vh', height: '100vh', minWidth: '100%', minHeight: '56.25vw' }}
            allow="autoplay; fullscreen"
            title="FerroSite hero background"
          />
        </div>

        {/* FALLBACK MOBILE */}
        <div className="absolute inset-0 z-0 md:hidden bg-black">
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
              backgroundSize: "30px 30px"
            }}
          />
        </div>

        <div className="absolute inset-0 z-[1] bg-black/50 backdrop-blur-[2px]" />

        {/* CONTEÚDO ANIMADO */}
        <div ref={contentRef} className="relative z-10 flex flex-col items-center px-6 text-center lg:px-0 mx-auto max-w-5xl -mt-[10vh] will-change-[opacity,transform]">
          <div>
            <span ref={badgeRef} className="mb-8 inline-block rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#E84E1B] backdrop-blur-md opacity-0 will-change-[opacity,transform]">
              {HERO_CONTENT.badge}
            </span>
            <h1 ref={titleRef} className="mb-4 text-5xl font-black tracking-tighter text-white sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-2xl opacity-0 will-change-[opacity,transform]">
              {HERO_CONTENT.title}
            </h1>
          </div>

          <div>
            <h2 ref={subtitleRef} className="mb-10 text-2xl font-light tracking-tight text-white/90 sm:text-3xl md:text-4xl drop-shadow-lg opacity-0 will-change-[opacity,transform]">
              {HERO_CONTENT.subtitle}
            </h2>
          </div>

          <div>
            <p ref={descRef} className="mx-auto mb-14 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl opacity-0 will-change-[opacity,transform]">
              {HERO_CONTENT.description}
            </p>
            
            <div ref={buttonsRef} className="flex flex-col gap-5 sm:flex-row sm:justify-center opacity-0 will-change-[opacity,transform]">
              <Link
                href="#portal"
                className="group relative flex min-h-[60px] items-center justify-center overflow-hidden rounded-full bg-[#E84E1B] px-14 text-base font-bold text-white shadow-[0_0_20px_rgba(232,78,27,0.4)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(232,78,27,0.8)] hover:scale-105 hover:-translate-y-1 active:scale-95"
              >
                {HERO_CONTENT.primaryButton}
              </Link>
              <Link
                href="/sobre"
                className="flex min-h-[60px] items-center justify-center rounded-full border border-white/30 bg-black/20 px-14 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/60 hover:scale-105 hover:-translate-y-1 active:scale-95"
              >
                {HERO_CONTENT.secondaryButton}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator (nativo do Tailwind) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
