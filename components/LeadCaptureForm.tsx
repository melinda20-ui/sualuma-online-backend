"use client";

import { useState, useTransition } from "react";
import { createLead } from "@/app/actions/leads";

export default function LeadCaptureForm() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("Enviando...");

    startTransition(async () => {
      const result = await createLead(formData);
      setMessage(result.message);

      if (result.ok) {
        const form = document.getElementById("lead-capture-form") as HTMLFormElement | null;
        form?.reset();
      }
    });
  }

  return (
    <form id="lead-capture-form" action={handleSubmit} className="lead-form">
      <input type="text" name="nome" placeholder="Seu nome" required />
      <input type="email" name="email" placeholder="Seu melhor e-mail" required />

      <button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Entrar na lista"}
      </button>

      {message && <p className="lead-message">{message}</p>}
    </form>
  );
}
