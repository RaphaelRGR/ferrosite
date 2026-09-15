"use client";

import { Subject } from "@/data/curriculums";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface SubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Detalhe da disciplina sobre o Dialog acessível (trap, Escape, retorno de foco).
 * Substitui a implementação em div/GSAP sem semântica (auditoria P1).
 */
export function SubjectModal({ subject, isOpen, onClose }: SubjectModalProps) {
  return (
    <Dialog
      open={isOpen && !!subject}
      onClose={onClose}
      title={subject?.name ?? ""}
      className="pt-4"
    >
      {subject && (
        <>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-block rounded bg-surface-2 px-2 py-1 font-mono text-xs font-bold text-fg-muted">
                {subject.id}
              </span>
              {subject.ext && (
                <span className="inline-block rounded border border-accent/30 bg-accent/20 px-2 py-1 text-xs font-bold text-accent">
                  EXTENSÃO
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="block text-2xl font-black text-accent">{subject.hours}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">Horas/Aula</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-fg-muted">Visão Geral &amp; Impacto</h3>
            <p className="text-lg leading-relaxed text-fg">
              {subject.ementa ||
                "Informações detalhadas sobre esta disciplina estão sendo atualizadas. Ela compõe um pilar importante da sua formação como engenheiro."}
            </p>
          </div>

          {subject.pre && subject.pre.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-fg-muted">Pré-requisitos</h3>
              <ul className="flex flex-wrap gap-2">
                {subject.pre.map((preId) => (
                  <li key={preId} className="rounded border border-line bg-surface-2 px-3 py-1 font-mono text-sm text-fg">
                    {preId}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-line pt-6">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
