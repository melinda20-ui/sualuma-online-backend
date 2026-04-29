"use client";

import { useEffect } from "react";

const STYLE_ID = "sualuma-login-mobile-robot-below-text";

function cleanText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function area(el: Element) {
  const r = el.getBoundingClientRect();
  return Math.max(1, r.width * r.height);
}

export default function LoginMobileRobotBelowText() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/login")) return;

    const apply = () => {
      if (window.innerWidth > 760) return;

      document.body.classList.add("sualuma-login-mobile-adjusted");

      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.innerHTML = `
@media (max-width: 760px) {
  body.sualuma-login-mobile-adjusted {
    overflow-x: hidden !important;
  }

  body.sualuma-login-mobile-adjusted .sualuma-login-hero-parent {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    padding-bottom: 22px !important;
  }

  body.sualuma-login-mobile-adjusted .sualuma-login-hero-text {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    transform: none !important;
    z-index: 4 !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 22px 0 18px 0 !important;
    padding: 0 !important;
    text-align: left !important;
  }

  body.sualuma-login-mobile-adjusted .sualuma-login-hero-text h1,
  body.sualuma-login-mobile-adjusted .sualuma-login-hero-text [class*="title"],
  body.sualuma-login-mobile-adjusted .sualuma-login-hero-text [class*="Title"] {
    font-size: clamp(34px, 10.5vw, 52px) !important;
    line-height: 1.04 !important;
    letter-spacing: -0.05em !important;
    max-width: 100% !important;
  }

  body.sualuma-login-mobile-adjusted .sualuma-login-hero-text p {
    font-size: clamp(16px, 4.6vw, 21px) !important;
    line-height: 1.45 !important;
    max-width: 100% !important;
  }

  body.sualuma-login-mobile-adjusted .sualuma-login-robot-mobile {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    transform: none !important;
    z-index: 4 !important;
    display: block !important;
    width: min(280px, 82vw) !important;
    max-width: 100% !important;
    min-height: 210px !important;
    margin: 4px auto 26px auto !important;
    pointer-events: none !important;
  }

  body.sualuma-login-mobile-adjusted .sualuma-login-robot-mobile * {
    max-width: 100% !important;
  }
}
        `;
        document.head.appendChild(style);
      }

      const headings = Array.from(document.querySelectorAll("h1, h2, [class*='title'], [class*='Title']"));

      const title = headings.find((el) => {
        const text = cleanText(el.textContent || "");
        return text.includes("seu sistema inteligente") || text.includes("automacao, agentes");
      }) as HTMLElement | undefined;

      if (!title) return;

      let heroText: HTMLElement | null = title;
      for (let i = 0; i < 5; i++) {
        if (!heroText?.parentElement) break;
        const text = cleanText(heroText.textContent || "");
        if (text.includes("ecossistema digital") || text.includes("automacao, agentes")) break;
        heroText = heroText.parentElement;
      }

      if (!heroText) return;

      const robotCandidates = Array.from(document.querySelectorAll("div, section, article")).filter((el) => {
        const text = cleanText(el.textContent || "");
        return (
          text.includes("ola") &&
          text.includes("sistema inteligente") &&
          !text.includes("seu sistema inteligente para automacao")
        );
      });

      if (!robotCandidates.length) return;

      let robotBox = robotCandidates.sort((a, b) => area(a) - area(b))[0] as HTMLElement;

      for (let i = 0; i < 5; i++) {
        if (!robotBox.parentElement) break;

        const rect = robotBox.getBoundingClientRect();
        const parentRect = robotBox.parentElement.getBoundingClientRect();

        if (rect.height >= 150 && rect.width >= 120) break;

        if (parentRect.height > rect.height && parentRect.height < window.innerHeight * 0.7) {
          robotBox = robotBox.parentElement as HTMLElement;
        } else {
          break;
        }
      }

      if (!robotBox || robotBox.contains(heroText) || heroText.contains(robotBox)) return;

      heroText.classList.add("sualuma-login-hero-text");
      robotBox.classList.add("sualuma-login-robot-mobile");

      const parent = heroText.parentElement;
      if (parent) {
        parent.classList.add("sualuma-login-hero-parent");

        if (robotBox.parentElement !== parent || heroText.nextElementSibling !== robotBox) {
          heroText.insertAdjacentElement("afterend", robotBox);
        }
      }
    };

    apply();

    const timer = window.setTimeout(apply, 700);
    window.addEventListener("resize", apply);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", apply);
      document.body.classList.remove("sualuma-login-mobile-adjusted");
    };
  }, []);

  return null;
}
