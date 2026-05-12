'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navbar pill centralizada e flutuante.
 * - Esconde ao rolar para baixo (após 80px)
 * - Reaparece ao rolar para cima
 * - Animações feitas 100% com CSS transitions (sem gsap)
 * - Responsiva com menu mobile
 */

// Links principais de navegação
const NAV_LINKS = [
  { name: 'Sobre',     href: '/sobre'     },
  { name: 'Curso',     href: '/curso'     },
  { name: 'Visitas',   href: '/visitas'   },
  { name: 'Eventos',   href: '/eventos'   },
  { name: 'Notícias',  href: '/noticias'  },
];

// Sub-links do dropdown "Projetos"
const PROJECT_LINKS = [
  { name: 'Comunica Ferro',       href: '/projetos/comunica-ferro'    },
  { name: 'Cavalos de Ferro',     href: '/projetos/cavalos-de-ferro'  },
  { name: 'Ferro Lab',            href: '/projetos/ferro-lab'         },
  { name: 'Projetos de Extensão', href: '/projetos/extensao'          },
];

export function Navbar() {
  const [scrolled, setScrolled]             = useState(false);   // passou de 50px?
  const [visible, setVisible]               = useState(true);    // visibilidade da pill
  const [mobileOpen, setMobileOpen]         = useState(false);   // menu mobile aberto?
  const [projectsOpen, setProjectsOpen]     = useState(false);   // dropdown projetos?
  const [projectsMounted, setProjectsMounted] = useState(false); // para animação de entrada

  const lastScrollY  = useRef(0);
  const dropTimeout  = useRef<NodeJS.Timeout | null>(null);
  const pathname     = usePathname();

  // ─── Lógica de scroll ────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const y = window.scrollY;

    // Deixa o fundo mais opaco após 50px de scroll
    setScrolled(y > 50);

    // Esconde ao descer (após 80px), mostra ao subir
    if (y > lastScrollY.current && y > 80) {
      setVisible(false);
      setProjectsOpen(false); // fecha dropdown ao esconder
    } else {
      setVisible(true);
    }

    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ─── Fecha menus ao navegar ──────────────────────────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
    setProjectsOpen(false);
    setProjectsMounted(false);
  }, [pathname]);

  // ─── Hover no dropdown "Projetos" ────────────────────────────────────────────
  const openProjects = () => {
    if (dropTimeout.current) clearTimeout(dropTimeout.current);
    setProjectsMounted(true);
    // Pequeno delay para o mount acontecer antes da transição CSS
    requestAnimationFrame(() => requestAnimationFrame(() => setProjectsOpen(true)));
  };

  const closeProjects = () => {
    setProjectsOpen(false);
    // Aguarda a animação de saída antes de desmontar
    dropTimeout.current = setTimeout(() => setProjectsMounted(false), 300);
  };

  useEffect(() => () => {
    if (dropTimeout.current) clearTimeout(dropTimeout.current);
  }, []);

  // ─── Estilo base dos links ───────────────────────────────────────────────────
  const linkCls = (href: string) =>
    `relative text-[11px] font-black uppercase tracking-[0.15em] transition-colors duration-200 ${
      pathname === href ? 'text-[#E84E1B]' : 'text-white/60 hover:text-white'
    }`;

  return (
    /*
      Container full-width fixo no topo.
      pointer-events-none para não bloquear cliques fora da pill.
    */
    <div
      className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{
        /* Animação de visibilidade com transform + opacity */
        transform: visible ? 'translateY(0)' : 'translateY(-140%)',
        opacity:   visible ? 1 : 0,
        transition: visible
          ? 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease'  /* spring ao entrar */
          : 'transform 0.4s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.3s ease',       /* suave ao sair    */
      }}
    >
      {/* ── PILL PRINCIPAL ─────────────────────────────────────────────────── */}
      <nav
        className="pointer-events-auto w-full max-w-4xl rounded-full border border-white/10 px-5 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-all duration-500"
        style={{
          background: scrolled
            ? 'rgba(10, 10, 10, 0.75)'
            : 'rgba(10, 10, 10, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between gap-4">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #E84E1B, #ff7a4d)' }}
            >
              🚂
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-white font-black text-[10px] tracking-[0.12em] uppercase">
                Eng. Ferroviária
              </span>
              <span className="text-white/30 font-bold text-[8px] tracking-[0.2em] uppercase mt-0.5">
                UFSC Joinville
              </span>
            </div>
          </Link>

          {/* ── LINKS DESKTOP ──────────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkCls(link.href)}>
                {link.name}
                {/* sublinhado animado no link ativo */}
                <span
                  className="absolute -bottom-0.5 left-0 h-px bg-[#E84E1B] transition-all duration-300"
                  style={{ width: pathname === link.href ? '100%' : '0%' }}
                />
              </Link>
            ))}

            {/* DROPDOWN PROJETOS */}
            <div
              className="relative"
              onMouseEnter={openProjects}
              onMouseLeave={closeProjects}
            >
              <button
                className={`flex items-center gap-1 ${linkCls('/projetos')} outline-none cursor-default`}
                aria-expanded={projectsOpen}
              >
                Projetos
                {/* Seta giratória */}
                <svg
                  width="8" height="8" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="3"
                  className="mt-px"
                  style={{
                    transform:  projectsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown animado */}
              {projectsMounted && (
                <div
                  className="absolute top-full left-1/2 mt-4 w-52 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                  style={{
                    transform:  projectsOpen ? 'translateX(-50%) translateY(0) scale(1)'    : 'translateX(-50%) translateY(-8px) scale(0.95)',
                    opacity:    projectsOpen ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                    background: 'rgba(8, 8, 8, 0.92)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                  }}
                >
                  {/* Linha laranja decorativa no topo do dropdown */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E84E1B]/60 to-transparent" />
                  <div className="py-2">
                    {PROJECT_LINKS.map((link, i) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2.5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
                        style={{
                          /* Entrada em cascata baseada no índice */
                          transitionDelay: projectsOpen ? `${i * 40}ms` : '0ms',
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full bg-[#E84E1B] opacity-0 transition-opacity duration-200"
                          style={{ opacity: pathname === link.href ? 1 : undefined }}
                        />
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÃO PORTAL (desktop) */}
          <div className="hidden lg:block shrink-0">
            <Link
              href="/portal"
              className="relative overflow-hidden bg-[#E84E1B] text-white text-[10px] font-black uppercase tracking-[0.18em] px-5 py-2.5 rounded-full transition-all duration-300 hover:shadow-[0_0_25px_rgba(232,78,27,0.5)] hover:scale-105 active:scale-95"
            >
              Portal
            </Link>
          </div>

          {/* BOTÃO HAMBURGUER (mobile) */}
          <button
            className="lg:hidden text-white p-1.5 rounded-full border border-white/10 hover:border-white/30 transition-all duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {/* Ícone animado com CSS */}
            <div className="w-4 h-3 flex flex-col justify-between">
              <span
                className="block h-px bg-white rounded-full origin-center transition-all duration-300"
                style={{
                  transform: mobileOpen ? 'rotate(45deg) translateY(6px)' : 'none',
                  width: '100%',
                }}
              />
              <span
                className="block h-px bg-white rounded-full transition-all duration-300"
                style={{ opacity: mobileOpen ? 0 : 1, width: '75%' }}
              />
              <span
                className="block h-px bg-white rounded-full origin-center transition-all duration-300"
                style={{
                  transform: mobileOpen ? 'rotate(-45deg) translateY(-6px)' : 'none',
                  width: '100%',
                }}
              />
            </div>
          </button>
        </div>

        {/* ── MENU MOBILE PREMIUM ────────────────────────────────────────────────── */}
        <div
          className={`lg:hidden fixed inset-0 z-[-1] bg-black transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] ${
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Background Decor */}
          <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E84E1B] blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E84E1B] blur-[120px] rounded-full animate-pulse delay-1000" />
          </div>

          <div className="h-full flex flex-col px-8 pt-32 pb-12 overflow-y-auto">
            <div className="flex flex-col gap-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E84E1B]">Navegação</p>
              <div className="flex flex-col gap-6">
                {NAV_LINKS.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-4xl font-black text-white hover:text-[#E84E1B] transition-colors"
                    style={{
                      transform: mobileOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: mobileOpen ? 1 : 0,
                      transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + i * 0.1}s`,
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-16 flex flex-col gap-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E84E1B]">Projetos</p>
              <div className="grid grid-cols-1 gap-4">
                {PROJECT_LINKS.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-bold text-white/40 hover:text-white transition-colors"
                    style={{
                      transform: mobileOpen ? 'translateY(0)' : 'translateY(10px)',
                      opacity: mobileOpen ? 1 : 0,
                      transition: `all 0.5s ease ${0.4 + i * 0.05}s`,
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-12 flex flex-col gap-8">
              <Link
                href="/portal"
                className="w-full bg-[#E84E1B] text-white text-center py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(232,78,27,0.3)]"
                style={{
                  transform: mobileOpen ? 'scale(1)' : 'scale(0.9)',
                  opacity: mobileOpen ? 1 : 0,
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s`,
                }}
              >
                Portal do Aluno
              </Link>
              
              <div className="flex justify-between items-center text-white/20">
                <span className="text-[10px] font-bold uppercase tracking-widest">© 2026 UFSC Joinville</span>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs">IG</div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs">LK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
