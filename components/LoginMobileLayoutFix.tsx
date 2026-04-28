"use client";

import { useEffect } from "react";

const STYLE_ID = "sualuma-login-mobile-fix";

const css = `
@media (max-width: 760px) {
  body.sualuma-login-page {
    overflow-x: hidden !important;
  }

  body.sualuma-login-page .sl-login-hero {
    position: relative !important;
    overflow: hidden !important;
    min-height: auto !important;
    max-height: none !important;
    padding: 28px 24px 26px !important;
    display: block !important;
    border-radius: 30px !important;
  }

  body.sualuma-login-page .sl-login-hero * {
    box-sizing: border-box !important;
  }

  body.sualuma-login-page .sl-login-title {
    clear: both !important;
    font-size: clamp(34px, 10vw, 48px) !important;
    line-height: 1.02 !important;
    letter-spacing: -0.05em !important;
    max-width: 100% !important;
    width: 100% !important;
    margin: 14px 0 14px 0 !important;
    padding: 0 !important;
    text-align: left !important;
    transform: none !important;
  }

  body.sualuma-login-page .sl-login-hero p {
    font-size: 16px !important;
    line-height: 1.45 !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    transform: none !important;
  }

  body.sualuma-login-page .sl-login-bubble {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    width: min(190px, 58vw) !important;
    max-width: 190px !important;
    margin: 12px 0 8px 0 !important;
    transform: none !important;
    z-index: 4 !important;
  }

  body.sualuma-login-page .sl-login-robot {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    width: min(118px, 32vw) !important;
    max-width: 118px !important;
    height: auto !important;
    transform: none !important;
    float: left !important;
    margin: 4px 16px 8px 0 !important;
    z-index: 3 !important;
    pointer-events: none !important;
  }

  body.sualuma-login-page input,
  body.sualuma-login-page button {
    font-size: 16px !important;
  }

  body.sualuma-login-page form,
  body.sualuma-login-page .auth-card,
  body.sualuma-login-page .login-card {
    max-width: 100% !important;
  }
}

@media (max-width: 430px) {
  body.sualuma-login-page .sl-login-hero {
    padding: 24px 20px 24px !important;
  }

  body.sualuma-login-page .sl-login-title {
    font-size: clamp(32px, 10.5vw, 42px) !important;
  }

  body.sualuma-login-page .sl-login-robot {
    width: 104px !important;
    max-width: 30vw !important;
    margin-right: 12px !important;
  }

  body.sualuma-login-page .sl-login-bubble {
    width: min(170px, 56vw) !important;
  }
}
`;

function markLoginLayout() {
  const authPaths = ["/login", "/entrar", "/cadastro", "/register", "/registrar"];
  const isLoginPage = authPaths.some((path) => window.location.pathname.startsWith(path));

  document.body.classList.toggle("sualuma-login-page", isLoginPage);

  if (!isLoginPage) return;

  const all = Array.from(
    document.querySelectorAll<HTMLElement>("main, section, header, div")
  );

  const hero = all.find((el) => {
    const text = el.innerText || "";
    return text.includes("SUALUMA OS") && text.includes("Seu sistema inteligente");
  });

  if (!hero) return;

  hero.classList.add("sl-login-hero");

  const title = Array.from(hero.querySelectorAll<HTMLElement>("h1, h2")).find((el) =>
    (el.innerText || "").includes("Seu sistema inteligente")
  );

  title?.classList.add("sl-login-title");

  const bubble = all.find((el) => {
    const text = el.innerText || "";
    return text.includes("Olá") && text.includes("Esse é o seu");
  });

  bubble?.classList.add("sl-login-bubble");

  const robotCandidates = Array.from(
    hero.querySelectorAll<HTMLElement>(
      '[class*="robot"], [class*="Robot"], [class*="bot"], [class*="Bot"], img[alt*="rob"], img[src*="rob"], img[src*="robo"]'
    )
  );

  let biggest: HTMLElement | null = null;
  let biggestArea = 0;

  for (const el of robotCandidates) {
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > biggestArea) {
      biggest = el;
      biggestArea = area;
    }
  }

  biggest?.classList.add("sl-login-robot");
}

export default function LoginMobileLayoutFix() {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }

    markLoginLayout();

    const t1 = window.setTimeout(markLoginLayout, 300);
    const t2 = window.setTimeout(markLoginLayout, 900);
    const t3 = window.setTimeout(markLoginLayout, 1600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return null;
}
