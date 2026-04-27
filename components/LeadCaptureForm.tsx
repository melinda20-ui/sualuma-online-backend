"use client";

import { useState } from "react";

export default function LeadCaptureForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const nome = String(formData.get("nome") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!nome || !email || !email.includes("@")) {
      setMessage("Preencha seu nome e um e-mail válido.");
      return;
    }

    setLoading(true);
    setMessage("Enviando...");

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, email }),
    });

    if (!response.ok) {
      setLoading(false);
      setMessage("Não conseguimos salvar agora. Tente novamente.");
      return;
    }

    window.location.href = "https://sospublicidade.sualuma.online/obrigada";
  }

  return (
    <form onSubmit={handleSubmit} className="lead-form">
      <input type="text" name="nome" placeholder="Seu nome" required />
      <input type="email" name="email" placeholder="Seu melhor e-mail" required />

      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Entrar na lista"}
      </button>

      {message && <p className="lead-message">{message}</p>}
    </form>
  );
}
