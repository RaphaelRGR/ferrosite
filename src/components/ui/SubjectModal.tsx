"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Subject } from "@/data/curriculums";

interface SubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SubjectModal({ subject, isOpen, onClose }: SubjectModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && overlayRef.current && modalRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (overlayRef.current && modalRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
      gsap.to(modalRef.current, { 
        opacity: 0, y: 20, scale: 0.95, duration: 0.2, 
        onComplete: onClose 
      });
    } else {
      onClose();
    }
  };

  if (!isOpen || !subject) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-[#1A1A1A]/90 backdrop-blur-md border border-[#333] rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com a cor da categoria (simulado com laranja padrão aqui, mas podemos mapear) */}
        <div className="h-2 w-full bg-gradient-to-r from-[#E84E1B] to-[#FF8C00]"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block px-2 py-1 text-xs font-bold bg-[#333] text-gray-300 rounded mb-3 font-mono">
                {subject.id}
              </span>
              {subject.ext && (
                <span className="inline-block ml-2 px-2 py-1 text-xs font-bold bg-[#E84E1B]/20 text-[#E84E1B] border border-[#E84E1B]/30 rounded mb-3">
                  EXTENSÃO
                </span>
              )}
              <h2 className="text-3xl font-bold text-white leading-tight">
                {subject.name}
              </h2>
            </div>
            <div className="text-right ml-4">
              <span className="block text-2xl font-black text-[#E84E1B]">{subject.hours}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Horas/Aula</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-8">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Visão Geral & Impacto</h4>
            <p className="text-gray-300 leading-relaxed text-lg">
              {subject.ementa || "Informações detalhadas sobre esta disciplina estão sendo atualizadas. Ela compõe um pilar importante da sua formação como engenheiro."}
            </p>
          </div>

          {subject.pre && subject.pre.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Pré-requisitos</h4>
              <div className="flex flex-wrap gap-2">
                {subject.pre.map(preId => (
                  <span key={preId} className="px-3 py-1 bg-[#242424] border border-[#333] text-sm text-gray-300 rounded font-mono">
                    {preId}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#333] flex justify-end">
            <button 
              onClick={handleClose}
              className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
