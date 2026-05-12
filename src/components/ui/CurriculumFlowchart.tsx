"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CURRICULUMS, Subject, Phase } from "@/data/curriculums";
import { SubjectModal } from "./SubjectModal";

// Cores baseadas nas categorias para as bolinhas/linhas
const CAT_COLORS: Record<string, string> = {
  math: "#3b82f6", physics: "#22c55e", mech: "#f59e0b",
  fluid: "#eab308", elec: "#a855f7", railway: "#14b8a6",
  material: "#8b4513", human: "#94a3b8", design: "#06b6d4",
  comp: "#6366f1", project: "#ec4899", mgmt: "#64748b"
};

export function CurriculumFlowchart() {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeDependencies, setActiveDependencies] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<any[]>([]);

  const activeCurriculum = CURRICULUMS.find(c => c.year === selectedYear) || CURRICULUMS[0];

  const findDependencies = useCallback((subjectId: string, curr: typeof activeCurriculum) => {
    const deps = new Set<string>();
    const searchPre = (id: string) => {
      curr.phases.forEach(p => p.subjects.forEach(s => {
        if (s.id === id && s.pre) {
          s.pre?.forEach(pid => {
            deps.add(pid);
            searchPre(pid);
          });
        }
      }));
    };
    searchPre(subjectId);
    return deps;
  }, []);

  const handleMouseEnter = (subject: Subject) => {
    setHoveredId(subject.id);
    setActiveDependencies(findDependencies(subject.id, activeCurriculum));
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setActiveDependencies(new Set());
    setLines([]);
  };

  useEffect(() => {
    if (!hoveredId || !containerRef.current) {
      setLines([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: any[] = [];

    activeCurriculum.phases.forEach(p => p.subjects.forEach(s => {
      if (s.id === hoveredId || activeDependencies.has(s.id)) {
        if (s.pre) {
          s.pre?.forEach((preId, index) => {
            if (s.id !== hoveredId && !activeDependencies.has(s.id)) return;

            const fromEl = cardRefs.current[preId];
            const toEl = cardRefs.current[s.id];
            
            if (fromEl && toEl) {
              const fromR = fromEl.getBoundingClientRect();
              const toR = toEl.getBoundingClientRect();
              
              const offset = (index - ((s.pre?.length ?? 1) - 1) / 2) * 8;
              
              const x1 = fromR.right - containerRect.left;
              const y1 = fromR.top - containerRect.top + (fromR.height / 2);
              
              const x2 = toR.left - containerRect.left;
              const y2 = toR.top - containerRect.top + (toR.height / 2) + offset;
              
              const midX = x1 + (x2 - x1) * 0.5;
              const color = CAT_COLORS[s.cat] || "#E84E1B";
              const isDirect = s.id === hoveredId;

              newLines.push({
                id: `${preId}-${s.id}`,
                d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`,
                color: isDirect ? "#E84E1B" : color,
                width: isDirect ? 3 : 1.5,
                opacity: isDirect ? 1 : 0.4
              });
            }
          });
        }
      }
    }));

    setLines(newLines);
  }, [hoveredId, activeDependencies, activeCurriculum]);

  return (
    <section className="bg-[#0F0F0F] py-20 overflow-hidden relative min-h-screen">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#E84E1B]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1900px] mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">
              A JORNADA TÉCNICA
            </h2>
            <p className="text-gray-400 font-medium max-w-2xl">
              Explore o fluxograma das disciplinas. Passe o mouse para ver os caminhos de pré-requisitos e clique para detalhes.
            </p>
          </div>
          <div className="flex gap-2 mt-6 md:mt-0 bg-[#1A1A1A] p-1 rounded-lg border border-white/10 shadow-2xl">
            {CURRICULUMS.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedYear(c.year)}
                className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                  selectedYear === c.year 
                    ? "bg-[#E84E1B] text-white shadow-lg shadow-[#E84E1B]/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                Grade {c.year}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-10 custom-scrollbar">
          <div ref={containerRef} className="relative min-w-[1500px] py-4">
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
              {lines.map(line => (
                <path
                  key={line.id}
                  d={line.d}
                  stroke={line.color}
                  strokeWidth={line.width}
                  fill="none"
                  opacity={line.opacity}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              ))}
            </svg>

            <div className="grid grid-cols-10 gap-4 relative z-20">
              {activeCurriculum.phases.map((phase: Phase) => (
                <div key={phase.phase} className="flex flex-col gap-3">
                  <div className="bg-white/5 border border-white/10 text-gray-400 text-center py-2 rounded font-bold text-[10px] tracking-widest uppercase">
                    {phase.phase}ª FASE
                  </div>
                  {phase.subjects.map((subject: Subject) => {
                    const isHovered = hoveredId === subject.id;
                    const isDep = activeDependencies.has(subject.id);
                    const isDimmed = hoveredId !== null && !isHovered && !isDep;

                    return (
                      <div
                        key={subject.id}
                        ref={(el) => { cardRefs.current[subject.id] = el; }}
                        onMouseEnter={() => handleMouseEnter(subject)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => setSelectedSubject(subject)}
                        className={`
                          relative bg-[#1A1A1A]/80 backdrop-blur-md border rounded-lg p-3 cursor-pointer flex flex-col gap-1
                          transition-all duration-300
                          ${isHovered ? 'border-white shadow-2xl shadow-white/10 scale-105 z-30 translate-y-[-2px]' : 'border-white/10 hover:border-white/20'}
                          ${isDep ? 'border-[#E84E1B]/50 bg-[#E84E1B]/10' : ''}
                          ${isDimmed ? 'opacity-10 grayscale' : 'opacity-100'}
                        `}
                        style={{
                          borderTopWidth: '3px',
                          borderTopColor: CAT_COLORS[subject.cat] || '#333'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-bold text-gray-500 font-mono tracking-tighter">{subject.id}</span>
                          {subject.ext && <span className="text-[7px] font-black bg-[#E84E1B] text-white px-1 rounded-sm">EXT</span>}
                        </div>
                        <h3 className="text-[11px] font-bold text-white leading-snug flex-1 mt-1 tracking-tight">
                          {subject.name}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CAT_COLORS[subject.cat] }} />
                          <span className="text-[9px] text-gray-500 font-bold">
                            {subject.hours}H
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <SubjectModal 
        subject={selectedSubject} 
        isOpen={!!selectedSubject} 
        onClose={() => setSelectedSubject(null)} 
      />
    </section>
  );
}
