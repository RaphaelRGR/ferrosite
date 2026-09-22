"use client";

import { useEffect, useState } from "react";
import { Locomotive } from "./Locomotive";

const WORDS = ["trem", "train", "tchutchu"];
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/**
 * Easter eggs discretos: digitar "trem" (ou "train"), o código Konami ou
 * clicar 5x no logotipo faz um trem cruzar a base da tela. Decorativo,
 * sem som, respeita movimento reduzido e nunca captura teclas em campos.
 */
export function EasterEggs() {
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let typed = "";
    let konami = 0;
    let clicks: number[] = [];
    const trigger = () => setRun((n) => n + 1);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        trigger();
        return;
      }
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-12);
      if (WORDS.some((w) => typed.endsWith(w))) {
        typed = "";
        trigger();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest("[data-brand-logo]")) return;
      const now = Date.now();
      clicks = [...clicks.filter((t) => now - t < 3000), now];
      if (clicks.length >= 5) {
        clicks = [];
        e.preventDefault();
        trigger();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  useEffect(() => {
    if (!run) return;
    const t = setTimeout(() => setRun(0), 6200);
    return () => clearTimeout(t);
  }, [run]);
  if (!run) return null;
  return (
    <div key={run} aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-2 z-[90]">
      <div className="train-cross w-40 text-fg sm:w-56">
        <Locomotive running />
      </div>
    </div>
  );
}
