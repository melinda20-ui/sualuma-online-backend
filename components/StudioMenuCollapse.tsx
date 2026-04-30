"use client";

import { useEffect, useState } from "react";

function isStudioPath() {
  return (
    window.location.pathname.startsWith("/studio-lab") ||
    window.location.pathname.startsWith("/studio")
  );
}

function scoreSidebar(el: HTMLElement) {
  const text = (el.innerText || "").trim();
  const rect = el.getBoundingClientRect();

  let score = 0;

  if (text.includes("Studio Sualuma")) score += 80;
  if (text.includes("Torre de Controle")) score += 70;
  if (text.includes("Visão Geral")) score += 25;
  if (text.includes("Relatórios")) score += 15;
  if (text.includes("Marketing Orgânico")) score += 15;
  if (text.includes("Suporte")) score += 12;
  if (text.includes("CNPJ")) score += 8;

  if (rect.left <= 60) score += 25;
  if (rect.width >= 240 && rect.width <= 430) score += 35;
  if (rect.height >= window.innerHeight * 0.55) score += 20;

  // Não pode ser a página inteira/conteúdo principal
  if (rect.width > window.innerWidth * 0.92) score -= 120;
  if (text.includes("Uma visão de startup gigante")) score -= 120;
  if (text.includes("Pesquisar usuário")) score -= 100;
  if (text.includes("Seu império")) score -= 80;
  if (text.includes("Cérebro Operacional")) score -= 80;

  return score;
}

function findSidebar(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>("aside, nav, section, div"));

  const candidates = all
    .map((el) => ({
      el,
      score: scoreSidebar(el),
      area: el.getBoundingClientRect().width * el.getBoundingClientRect().height,
    }))
    .filter((item) => item.score >= 120)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.area - b.area;
    });

  return candidates[0]?.el || null;
}

function applyMenu(open: boolean) {
  document.body.classList.toggle("studio-mobile-menu-open", open);
  document.body.classList.toggle("studio-mobile-menu-closed", !open);

  document
    .querySelectorAll(".studio-mobile-menu-target")
    .forEach((el) => el.classList.remove("studio-mobile-menu-target"));

  const sidebar = findSidebar();

  if (sidebar) {
    sidebar.classList.add("studio-mobile-menu-target");
    sidebar.scrollTop = 0;
  }
}

export default function StudioMenuCollapse() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isStudioPath()) return;

    setEnabled(true);

    const saved = window.localStorage.getItem("studio-mobile-menu-open");
    const initialOpen = saved === "true";

    setOpen(initialOpen);

    const run = () => applyMenu(initialOpen);

    run();
    const t1 = window.setTimeout(run, 300);
    const t2 = window.setTimeout(run, 900);
    const t3 = window.setTimeout(run, 1800);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    applyMenu(open);
    window.localStorage.setItem("studio-mobile-menu-open", open ? "true" : "false");
  }, [open, enabled]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        className="studio-mobile-menu-button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        {open ? "‹" : "☰"}
      </button>

      {open && (
        <button
          type="button"
          className="studio-mobile-menu-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <style jsx global>{`
        .studio-mobile-menu-button {
          position: fixed;
          left: 20px;
          bottom: 78px;
          z-index: 999999;
          width: 58px;
          height: 58px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          color: white;
          display: grid;
          place-items: center;
          font-size: 34px;
          font-weight: 900;
          line-height: 1;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }

        .studio-mobile-menu-backdrop {
          display: none;
        }

        @media (max-width: 780px) {
          .studio-mobile-menu-target {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 86vw !important;
            max-width: 360px !important;
            min-width: 280px !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow-y: auto !important;
            z-index: 999990 !important;
            padding-top: max(34px, env(safe-area-inset-top)) !important;
            padding-bottom: 120px !important;
            transition: transform 0.28s ease, opacity 0.28s ease !important;
            transform: translateX(-110%) !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          body.studio-mobile-menu-open .studio-mobile-menu-target {
            transform: translateX(0) !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }

          body.studio-mobile-menu-closed .studio-mobile-menu-target {
            transform: translateX(-110%) !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          .studio-mobile-menu-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 999980;
            border: 0;
            background: rgba(0, 0, 0, 0.58);
            backdrop-filter: blur(8px);
          }

          body.studio-mobile-menu-open .studio-mobile-menu-button {
            z-index: 1000000;
            left: min(300px, calc(86vw - 28px));
          }
        }
      `}</style>
    </>
  );
}
