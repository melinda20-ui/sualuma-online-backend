"use client";

import { useEffect, useState } from "react";

const MENU_MARKERS = [
  "Visão Geral",
  "UX",
  "Relatórios",
  "Marketing Orgânico",
  "Tarefas do Sistema",
  "Admin Loja",
  "Suporte",
  "CNPJ",
];

function isStudioRoute() {
  return (
    window.location.pathname.startsWith("/studio-lab") ||
    window.location.pathname.startsWith("/studio")
  );
}

function findTextElement(text: string): HTMLElement | null {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  let node: Node | null;

  while ((node = walker.nextNode())) {
    const value = node.textContent || "";

    if (value.includes(text)) {
      return node.parentElement;
    }
  }

  return null;
}

function commonAncestor(elements: HTMLElement[]) {
  if (!elements.length) return null;

  let current: HTMLElement | null = elements[0];

  while (current && current !== document.body) {
    const ok = elements.every((el) => current?.contains(el));

    if (ok) return current;

    current = current.parentElement;
  }

  return null;
}

function findMenuRoot(): HTMLElement | null {
  const found = MENU_MARKERS.map(findTextElement).filter(Boolean) as HTMLElement[];

  if (found.length < 4) return null;

  let root = commonAncestor(found);

  if (!root) return null;

  // Sobe até pegar a caixa lateral inteira, mas sem pegar body/main da página toda
  for (let i = 0; i < 8; i++) {
    const parent = root.parentElement;
    if (!parent || parent === document.body || parent.tagName.toLowerCase() === "main") break;

    const parentText = parent.innerText || "";
    const rect = parent.getBoundingClientRect();

    const hasMenu = MENU_MARKERS.filter((label) => parentText.includes(label)).length >= 4;
    const hasMainContent =
      parentText.includes("Uma visão de startup gigante") ||
      parentText.includes("Pesquisar usuário") ||
      parentText.includes("Seu império") ||
      parentText.includes("Cérebro operacional") ||
      parentText.includes("Stripe / Pagamentos");

    if (hasMenu && !hasMainContent && rect.width <= window.innerWidth * 0.96) {
      root = parent;
      continue;
    }

    break;
  }

  return root;
}

function applyState(open: boolean) {
  if (!isStudioRoute()) return;

  document.body.classList.toggle("studio-menu-mobile-open", open);
  document.body.classList.toggle("studio-menu-mobile-closed", !open);

  document
    .querySelectorAll(".studio-real-menu-mobile")
    .forEach((el) => el.classList.remove("studio-real-menu-mobile"));

  const menu = findMenuRoot();

  if (menu) {
    menu.classList.add("studio-real-menu-mobile");
  }
}

export default function StudioMenuCollapse() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isStudioRoute()) return;

    setEnabled(true);
    setOpen(false);

    const run = () => applyState(false);

    run();

    const timers = [
      window.setTimeout(run, 300),
      window.setTimeout(run, 900),
      window.setTimeout(run, 1800),
      window.setTimeout(run, 3000),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    applyState(open);
  }, [enabled, open]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        className="studio-menu-mobile-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        {open ? "‹" : "☰"}
      </button>

      {open && (
        <button
          type="button"
          className="studio-menu-mobile-cover"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <style jsx global>{`
        .studio-menu-mobile-toggle {
          position: fixed;
          left: 22px;
          bottom: 82px;
          z-index: 2147483647;
          width: 58px;
          height: 58px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 34px;
          font-weight: 900;
          line-height: 1;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
        }

        .studio-menu-mobile-cover {
          display: none;
        }

        @media (max-width: 780px) {
          .studio-real-menu-mobile {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 86vw !important;
            max-width: 360px !important;
            height: 100vh !important;
            max-height: 100vh !important;
            overflow-y: auto !important;
            z-index: 2147483600 !important;
            padding-top: max(28px, env(safe-area-inset-top)) !important;
            padding-bottom: 120px !important;
            background: rgba(5, 6, 20, 0.98) !important;
            transform: translateX(-115%) !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: transform 0.25s ease, opacity 0.25s ease !important;
            box-shadow: none !important;
          }

          body.studio-menu-mobile-open .studio-real-menu-mobile {
            transform: translateX(0) !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            box-shadow: 24px 0 90px rgba(0, 0, 0, 0.75) !important;
          }

          body.studio-menu-mobile-closed .studio-real-menu-mobile {
            transform: translateX(-115%) !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          .studio-menu-mobile-cover {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 2147483500;
            border: 0;
            background: rgba(0, 0, 0, 0.42);
          }

          body.studio-menu-mobile-open .studio-menu-mobile-toggle {
            left: min(300px, calc(86vw - 28px));
          }
        }
      `}</style>
    </>
  );
}
