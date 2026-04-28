"use client";

import { useEffect } from "react";

const STYLE_ID = "sualuma-login-mobile-safe-fix";

const css = `
@media (max-width: 760px) {
  html,
  body {
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    background: #020617 !important;
  }

  body.sualuma-login-page,
  body.sualuma-login-page * {
    box-sizing: border-box !important;
  }

  body.sualuma-login-page {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
  }

  body.sualuma-login-page main {
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
    overflow-x: hidden !important;
    transform: none !important;
  }

  body.sualuma-login-page main > * {
    max-width: 100% !important;
    min-width: 0 !important;
  }

  body.sualuma-login-page .sualumaAuthHero {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 14px auto 18px !important;
    padding: 24px 20px !important;
    overflow: hidden !important;
    display: block !important;
    transform: none !important;
    position: relative !important;
    border-radius: 28px !important;
  }

  body.sualuma-login-page .sualumaAuthTitle {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 18px 0 14px !important;
    padding: 0 !important;
    font-size: clamp(31px, 8.8vw, 40px) !important;
    line-height: 1.05 !important;
    letter-spacing: -0.045em !important;
    text-align: left !important;
    white-space: normal !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
    transform: none !important;
  }

  body.sualuma-login-page .sualumaAuthHero p {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    font-size: 16px !important;
    line-height: 1.45 !important;
    transform: none !important;
  }

  body.sualuma-login-page .sualumaAuthBubble,
  body.sualuma-login-page .sualumaAuthRobot {
    display: none !important;
  }

  body.sualuma-login-page form,
  body.sualuma-login-page section,
  body.sualuma-login-page [class*="card"],
  body.sualuma-login-page [class*="Card"] {
    max-width: 100% !important;
    min-width: 0 !important;
    transform: none !important;
  }

  body.sualuma-login-page input,
  body.sualuma-login-page button {
    max-width: 100% !important;
    font-size: 16px !important;
  }
}
`;

function markLoginPage() {
  const loginPaths = ["/login", "/entrar", "/cadastro", "/register", "/registrar"];
  const isLoginPage = loginPaths.some((path) => window.location.pathname.startsWith(path));

  document.body.classList.toggle("sualuma-login-page", isLoginPage);

  if (!isLoginPage) return;

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("main, section, header, div")
  );

  const hero = elements.find((el) => {
    const text = el.innerText || "";
    return text.includes("SUALUMA OS") && text.includes("Seu sistema inteligente");
  });

  if (hero) {
    hero.classList.add("sualumaAuthHero");

    const title = Array.from(hero.querySelectorAll<HTMLElement>("h1, h2")).find((el) =>
      (el.innerText || "").includes("Seu sistema inteligente")
    );

    title?.classList.add("sualumaAuthTitle");

    const bubble = elements.find((el) => {
      const text = el.innerText || "";
      return text.includes("Olá") && text.includes("Faça login para entrar");
    });

    bubble?.classList.add("sualumaAuthBubble");

    const robotCandidates = Array.from(
      hero.querySelectorAll<HTMLElement>(
        '[class*="robot"], [class*="Robot"], [class*="robo"], [class*="Robo"], img[alt*="rob"], img[src*="rob"], img[src*="robo"]'
      )
    );

    for (const el of robotCandidates) {
      el.classList.add("sualumaAuthRobot");
    }
  }
}

export default function LoginMobileSafeFix() {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }

    markLoginPage();

    const timers = [
      window.setTimeout(markLoginPage, 200),
      window.setTimeout(markLoginPage, 700),
      window.setTimeout(markLoginPage, 1400),
      window.setTimeout(markLoginPage, 2500),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}
