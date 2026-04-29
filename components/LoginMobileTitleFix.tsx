"use client";

import { useEffect } from "react";

export default function LoginMobileTitleFix() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/login")) return;

    const apply = () => {
      if (window.innerWidth > 760) return;

      const titles = Array.from(document.querySelectorAll("h1"));

      const title = titles.find((el) => {
        const text = (el.textContent || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        return (
          text.includes("seu sistema inteligente") ||
          text.includes("automacao") ||
          text.includes("agentes e crescimento")
        );
      }) as HTMLElement | undefined;

      if (!title) return;

      title.style.fontSize = "clamp(30px, 8.2vw, 42px)";
      title.style.lineHeight = "1.08";
      title.style.letterSpacing = "-0.045em";
      title.style.maxWidth = "92%";
    };

    apply();
    const t1 = window.setTimeout(apply, 300);
    const t2 = window.setTimeout(apply, 900);

    window.addEventListener("resize", apply);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", apply);
    };
  }, []);

  return null;
}
