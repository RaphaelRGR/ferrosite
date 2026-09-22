"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Revela seções conforme entram na tela (data-reveal / data-reveal-group).
 * Só marca `html.js-motion` quando o observador existe e o usuário não pediu
 * movimento reduzido: sem JS nada fica escondido. Re-observa a cada navegação
 * e a cada mudança do DOM (listas carregadas depois).
 */
export function MotionProvider() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("js-motion");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-in), [data-reveal-group]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
  return null;
}
