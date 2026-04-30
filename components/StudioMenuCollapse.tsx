"use client";

import { useEffect, useState } from "react";

function findStudioMenu(): HTMLElement | null {
  const selectors = [
    "[data-studio-sidebar]",
    ".studio-sidebar",
    ".studio-menu",
    ".sidebar",
    ".side-nav",
    ".sidenav",
    ".menu-lateral",
    "aside",
    "nav"
  ];

  const all = selectors.flatMap((selector) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector))
  );

  const unique = Array.from(new Set(all));

  const keywords = [
    "Studio",
    "Painel",
    "Dashboard",
    "Financeiro",
    "Stripe",
    "Planos",
    "Serviços",
    "Indique",
    "Marketing",
    "Usuários",
    "Conteúdo",
    "Notificações",
    "Sistema"
  ];

  const scored = unique
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const text = el.innerText || "";
      const className = String(el.className || "").toLowerCase();

      let score = 0;

      if (el.tagName.toLowerCase() === "aside") score += 8;
      if (el.tagName.toLowerCase() === "nav") score += 4;
      if (className.includes("sidebar")) score += 10;
      if (className.includes("side")) score += 6;
      if (className.includes("menu")) score += 5;
      if (rect.width >= 160) score += 4;
      if (rect.height >= window.innerHeight * 0.45) score += 4;
      if (rect.left < 80) score += 3;

      for (const keyword of keywords) {
        if (text.includes(keyword)) score += 2;
      }

      return { el, score };
    })
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.el || null;
}

export default function StudioMenuCollapse() {
  const [enabled, setEnabled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [found, setFound] = useState(false);

  useEffect(() => {
    const isStudio =
      window.location.pathname.startsWith("/studio") ||
      window.location.pathname.startsWith("/studio-lab");

    if (!isStudio) return;

    setEnabled(true);

    const saved = window.localStorage.getItem("sualuma-studio-menu-collapsed");
    const shouldCollapse = saved === "true";
    setCollapsed(shouldCollapse);

    const applyTarget = () => {
      const target = findStudioMenu();

      if (!target) {
        setFound(false);
        return;
      }

      target.classList.add("sualuma-studio-menu-target");
      setFound(true);
    };

    applyTarget();

    const timer1 = window.setTimeout(applyTarget, 600);
    const timer2 = window.setTimeout(applyTarget, 1400);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.toggle("sualuma-studio-menu-collapsed", collapsed);
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
          const target = findStudioMenu();
          if (target) {
            target.classList.add("sualuma-studio-menu-target");
            setFound(true);
          }
          setCollapsed((current) => !current);
        }}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-label={collapsed ? "Expandir menu do Studio" : "Recolher menu do Studio"}
      >
        <span>{collapsed ? "☰" : "‹"}</span>
      </button>

      {!found ? null : (
        <style jsx global>{`
          .sualuma-studio-menu-target {
            transition:
              width 0.25s ease,
              min-width 0.25s ease,
              max-width 0.25s ease,
              transform 0.25s ease,
              opacity 0.25s ease !important;
          }

          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target {
            width: 76px !important;
            min-width: 76px !important;
            max-width: 76px !important;
            overflow: hidden !important;
          }

          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target a,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target button,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target div {
            white-space: nowrap !important;
          }

          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target p,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target small,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target h1,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target h2,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target h3,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target .label,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target .text,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target .title,
          body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target .description {
            opacity: 0 !important;
            max-width: 0 !important;
            pointer-events: none !important;
          }

          .sualuma-studio-collapse-button {
            position: fixed;
            left: 16px;
            bottom: 18px;
            z-index: 999999;
            width: 46px;
            height: 46px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 999px;
            background:
              linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(56, 189, 248, 0.95));
            color: white;
            box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
            display: grid;
            place-items: center;
            cursor: pointer;
            backdrop-filter: blur(14px);
          }

          .sualuma-studio-collapse-button span {
            font-size: 28px;
            line-height: 1;
            transform: translateY(-1px);
          }

          @media (max-width: 780px) {
            .sualuma-studio-collapse-button {
              left: 14px;
              bottom: 14px;
              width: 48px;
              height: 48px;
            }

            body.sualuma-studio-menu-collapsed .sualuma-studio-menu-target {
              transform: translateX(-82%) !important;
              opacity: 0.96 !important;
            }
          }
        `}</style>
      )}
    </>
  );
}
