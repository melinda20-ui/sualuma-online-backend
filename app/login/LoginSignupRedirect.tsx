"use client";

import { useEffect, useRef } from "react";

export default function LoginSignupRedirect() {
  const alreadyRedirected = useRef(false);

  useEffect(() => {
    const shouldRedirect = () => {
      const bodyText = document.body.innerText.toLowerCase();

      const successTexts = [
        "cadastro realizado",
        "verifique seu e-mail",
        "verifique seu email",
        "confirme seu e-mail",
        "confirme seu email",
        "confirmar a conta",
        "check your email",
        "confirm your email",
        "confirmation email",
      ];

      return successTexts.some((text) => bodyText.includes(text));
    };

    const redirect = () => {
      if (alreadyRedirected.current) return;

      if (!shouldRedirect()) return;

      alreadyRedirected.current = true;

      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null;
      const email = emailInput?.value?.trim();

      const url = new URL("/bem-vindo", window.location.origin);

      if (email) {
        url.searchParams.set("email", email);
      }

      url.searchParams.set("check_email", "1");

      window.setTimeout(() => {
        window.location.href = url.toString();
      }, 900);
    };

    const interval = window.setInterval(redirect, 700);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
