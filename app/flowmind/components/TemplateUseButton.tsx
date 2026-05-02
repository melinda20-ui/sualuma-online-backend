"use client";

import { useState } from "react";

export default function TemplateUseButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function useTemplate() {
    try {
      setStatus("loading");

      const response = await fetch("/api/flowmind/use-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, name }),
      });

      if (!response.ok) {
        throw new Error("Erro ao usar template");
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fm-use-template-box">
      <button
        className="fm-commerce-btn primary full"
        onClick={useTemplate}
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Ativando..."
          : status === "success"
          ? "Template ativado ✓"
          : "Usar este template"}
      </button>

      {status === "success" && (
        <p>
          Pronto. O uso foi registrado. No próximo passo, isso vai criar tarefas,
          hábitos e plano dentro do painel.
        </p>
      )}

      {status === "error" && (
        <p className="danger">
          Não consegui registrar agora. Verifique o servidor ou tente novamente.
        </p>
      )}
    </div>
  );
}
