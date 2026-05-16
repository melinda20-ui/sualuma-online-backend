"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGET_TEXTS = [
  "escolha seu plano",
  "escolher seu plano",
  "voce ainda nao tem plano",
  "você ainda não tem plano",
  "selecione um plano para continuar",
];

// Rotas que são páginas de planos legítimas — nunca suprimir nelas
const PLAN_PAGE_PREFIXES = [
  "/prestador/planos",
  "/plans",
  "/planos",
  "/services/plans",
  "/member/plans",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findPopupContainer(element: Element) {
  let current: Element | null = element;

  for (let i = 0; current && current !== document.body && i < 8; i++) {
    const node = current as HTMLElement;
    const role = node.getAttribute("role") || "";
    const ariaModal = node.getAttribute("aria-modal") || "";
    const className = String(node.className || "").toLowerCase();
    const style = window.getComputedStyle(node);

    if (
      role === "dialog" ||
      ariaModal === "true" ||
      style.position === "fixed" ||
      className.includes("modal") ||
      className.includes("popup") ||
      className.includes("overlay")
    ) {
      return node;
    }

    current = current.parentElement;
  }

  return element instanceof HTMLElement ? element : null;
}

function hidePlanPopup() {
  const targets = TARGET_TEXTS.map(normalizeText);
  const elements = Array.from(document.querySelectorAll("body *"));

  for (const element of elements) {
    const text = normalizeText(element.textContent || "");

    if (!text) continue;

    const matches = targets.some((target) => text.includes(target));

    if (!matches) continue;

    const popup = findPopupContainer(element);

    if (
      popup &&
      popup !== document.body &&
      popup !== document.documentElement
    ) {
      // Só esconde se for realmente um popup/overlay (fixed/modal)
      const style = window.getComputedStyle(popup);
      const role = popup.getAttribute("role") || "";
      const ariaModal = popup.getAttribute("aria-modal") || "";
      const className = String(popup.className || "").toLowerCase();

      const isRealPopup =
        style.position === "fixed" ||
        role === "dialog" ||
        ariaModal === "true" ||
        className.includes("modal") ||
        className.includes("popup") ||
        className.includes("overlay") ||
        className.includes("gate");

      if (!isRealPopup) continue;

      popup.setAttribute("data-sualuma-plan-popup-disabled", "true");
      popup.style.setProperty("display", "none", "important");
      popup.style.setProperty("pointer-events", "none", "important");
      popup.style.setProperty("visibility", "hidden", "important");
    }
  }
}

export default function TemporaryDisablePlanPopup() {
  const pathname = usePathname();

  const isOnPlanPage = PLAN_PAGE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  useEffect(() => {
    if (isOnPlanPage) return;

    hidePlanPopup();

    const observer = new MutationObserver(() => {
      hidePlanPopup();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const interval = window.setInterval(hidePlanPopup, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [isOnPlanPage]);

  return null;
}
