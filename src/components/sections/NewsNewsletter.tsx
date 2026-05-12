"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function NewsNewsletter() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="bg-white py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           
           <div>
              <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
                 Newsletter
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter leading-[0.9] mb-8">
                 RECEBA AS ÚLTIMAS <br />
                 <span className="text-[#E84E1B]">DA FERROVIA</span> NO E-MAIL.
              </h2>
              <p className="text-black/50 text-lg leading-relaxed">
                 Toda semana, uma curadoria especial com as principais notícias, artigos e oportunidades do setor ferroviário brasileiro.
              </p>
           </div>

           <div className="relative">
              <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                 <div className="relative group">
                    <input 
                       type="email" 
                       placeholder="Seu melhor e-mail" 
                       className="w-full bg-[#F5F5F5] border-none rounded-2xl px-8 py-6 text-black placeholder:text-black/30 focus:ring-2 focus:ring-[#E84E1B] outline-none transition-all"
                    />
                 </div>
                 <button className="w-full bg-black text-white font-black uppercase tracking-widest text-xs py-6 rounded-2xl hover:bg-[#E84E1B] transition-all duration-300 shadow-xl shadow-black/10">
                    Inscrever-se Agora
                 </button>
                 <p className="text-[10px] text-black/30 text-center uppercase tracking-widest font-bold">
                    *Não enviamos spam. Cancele a qualquer momento.
                 </p>
              </form>

              {/* Elementos decorativos flutuantes */}
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#E84E1B] rounded-full blur-[40px] opacity-20 pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#E84E1B] rounded-full blur-[60px] opacity-10 pointer-events-none" />
           </div>

        </div>
      </div>
    </section>
  );
}
