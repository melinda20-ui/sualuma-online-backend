"use client";

import { useEffect } from "react";

export default function HideLegacySupportButton() {
  useEffect(() => {
    const hideOldSupport = () => {
      if (typeof window === "undefined") return;

      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("button, a, div, section, aside")
      );

      for (const node of nodes) {
        const text = (node.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

        const looksLikeSupport =
          text.includes("posso te ajudar") ||
          text.includes("fale comigo") ||
          text.includes("suporte");

        if (!looksLikeSupport) continue;

        let target: HTMLElement = node;

        let current: HTMLElement | null = node;
        while (current && current !== document.body) {
          const style = window.getComputedStyle(current);

          if (style.position === "fixed" || style.position === "sticky") {
            target = current;
            break;
          }

          current = current.parentElement;
        }

        const rect = target.getBoundingClientRect();

        const isFloatingBottomRight =
          rect.top > window.innerHeight * 0.42 &&
          rect.left > window.innerWidth * 0.42;

        const isMiaLeftButton =
          rect.left < window.innerWidth * 0.42 &&
          text.includes("posso te ajudar");

        if (isFloatingBottomRight && !isMiaLeftButton) {
          target.style.display = "none";
          target.style.pointerEvents = "none";
          target.setAttribute("data-hidden-legacy-support", "true");
        }
      }
    };

    hideOldSupport();

    const interval = window.setInterval(hideOldSupport, 700);

    const observer = new MutationObserver(hideOldSupport);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}
