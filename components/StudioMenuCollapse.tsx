"use client";

import { useEffect, useState } from "react";

function isStudioPath() {
  return (
    window.location.pathname.startsWith("/studio-lab") ||
    window.location.pathname.startsWith("/studio")
  );
}

function findCorrectStudioSidebar(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>("aside, nav, div"));

  const candidates = all
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const text = (el.innerText || "").trim();

      let score = 0;

      if (text.includes("Studio Sualuma")) score += 50;
      if (text.includes("Torre de Controle")) score += 40;
      if (text.includes("Visão Geral")) score += 15;
      if (text.includes("Relatórios")) score += 10;
      if (text.includes("Marketing Orgânico")) score += 10;
      if (text.includes("Suporte")) score += 8;

      if (rect.left <= 40) score += 20;
      if (rect.width >= 220 && rect.width <= 390) score += 25;
      if (rect.height >= window.innerHeight * 0.65) score += 10;

      // Penaliza blocos gigantes que são conteúdo/página inteira
      if (rect.width > window.innerWidth * 0.92) score -= 80;
      if (text.includes("Uma visão de startup gigante")) score -= 80;
      if (text.includes("Pesquisar usuário")) score -= 60;
      if (text.includes("Seu império")) score -= 50;

      return { el, score, area: rect.width * rect.height };
    })
    .filter((item) => item.score >= 60)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.area - b.area;
    });

  return candidates[0]?.el || null;
}

function applySidebarState(collapsed: boolean) {
  document.body.classList.toggle("sualuma-studio-menu-collapsed", collapsed);

  const currentTargets = document.querySelectorAll(".sualuma-studio-menu-target");
  currentTargets.forEach((el) => el.classList.remove("sualuma-studio-menu-target"));

  const sidebar = findCorrectStudioSidebar();

  if (sidebar) {
    sidebar.classList.add("sualuma-studio-menu-target");
    return true;
  }

  return false;
}

export default function StudioMenuCollapse() {
  const [enabled, setEnabled] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (!isStudioPath()) return;

    setEnabled(true);

    const saved = window.localStorage.getItem("sualuma-studio-menu-collapsed");
    const initialCollapsed = saved === null ? true : saved === "true";

    setCollapsed(initialCollapsed);

    const run = () => applySidebarState(initialCollapsed);

    run();
    const t1 = window.setTimeout(run, 500);
    const t2 = window.setTimeout(run, 1200);
    const t3 = window.setTimeout(run, 2200);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    applySidebarState(collapsed);
    window.localStorage.setItem(
      "sualuma-studio-menu-collapsed",
      collapsed ? "true" : "false"
    );
  }, [collapsed, enabled]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        className="sualuma-studio-collapse-button"
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          window.setTimeout(() => applySidebarState(next), 50);
        }}
        aria-label={collapsed ? "Abrir menu do Studio" : "Fechar menu do Studio"}
        title={collapsed ? "Abrir menu" : "Fechar menu"}
      >
        {collapsed ? "☰" : "‹"}
      </button>

      <style jsx global>{`
        .sualuma-studio-menu-target {
          transition:
            transform 0.28s ease,
            opacity 0.28s ease,
            box-shadow 0.28s ease !important;
          will-change: transform;
        }

        body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target {
          transform: translateX(calc(-100% + 10px)) !important;
          opacity: 0.98 !important;
          pointer-events: none !important;
        }

        body:not(.sualuma-studio-menu-collapsed) .sualuma-studio-menu-target {
          transform: translateX(0) !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: 99990 !important;
        }

        .sualuma-studio-collapse-button {
          position: fixed;
          left: 20px;
          bottom: 78px;
          z-index: 999999;
          width: 56px;
          height: 56px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 999px;
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          color: white;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
          display: grid;
          place-items: center;
          cursor: pointer;
          font-size: 34px;
          font-weight: 900;
          line-height: 1;
          backdrop-filter: blur(16px);
        }

        @media (max-width: 780px) {
          .sualuma-studio-collapse-button {
            left: 20px;
            bottom: 78px;
            width: 58px;
            height: 58px;
            font-size: 34px;
          }

          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target {
            transform: translateX(calc(-100% + 8px)) !important;
          }

          body:not(.sualuma-studio-menu-collapsed) .sualuma-studio-menu-target {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow-y: auto !important;
            z-index: 99990 !important;
          }
        }
      `}</style>
    </>
  );
}
