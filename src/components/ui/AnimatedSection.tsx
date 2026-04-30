"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  translateY?: string;
}

export function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  translateY = "translate-y-[40px]" 
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" } // Gatilho otimizado
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : `opacity-0 ${translateY} scale-[0.96]`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
