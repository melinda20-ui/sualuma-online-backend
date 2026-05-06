"use client";

import { useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordInline() {
  const [open, setOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function getEmailFromLoginInput() {
    if (typeof document === "undefined") return "";
    const input = document.querySelector('input[type="email"]') as HTMLInputElement | null;
    return input?.value?.trim().toLowerCase() || "";
  }

  async function handleReset() {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const email = (manualEmail || getEmailFromLoginInput()).trim().toLowerCase();

      if (!email || !email.includes("@")) {
        setError("Digite seu e-mail acima ou aqui embaixo.");
        return;
      }

      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
      });

      if (error) {
        setError(error.message || "Não foi possível enviar o link.");
        return;
      }

      setMessage("Enviamos o link para criar uma nova senha no seu e-mail.");
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar recuperação de senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-inline-wrap">
      <button
        type="button"
        className="forgot-inline-link"
        onClick={() => setOpen((value) => !value)}
      >
        Esqueci minha senha
      </button>

      {open && (
        <div className="forgot-inline-box">
          <p>
            Digite o e-mail da sua conta para receber um link e criar uma senha nova.
          </p>

          <input
            type="email"
            placeholder="seuemail@exemplo.com"
            value={manualEmail}
            onChange={(event) => setManualEmail(event.target.value)}
          />

          <button type="button" onClick={handleReset} disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>

          {message && <span className="forgot-inline-success">{message}</span>}
          {error && <span className="forgot-inline-error">{error}</span>}
        </div>
      )}

      <style>{`
        .forgot-inline-wrap {
          width: 100%;
          text-align: center;
          margin-top: 10px;
        }

        .forgot-inline-link {
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          padding: 4px 8px;
        }

        .forgot-inline-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .forgot-inline-box {
          margin-top: 12px;
          display: grid;
          gap: 10px;
          text-align: left;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(125, 211, 252, 0.24);
          background: rgba(15, 23, 42, 0.72);
        }

        .forgot-inline-box p {
          margin: 0;
          color: rgba(226, 232, 240, 0.82);
          font-size: 13px;
          line-height: 1.4;
        }

        .forgot-inline-box input {
          width: 100%;
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.36);
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
          padding: 10px 12px;
          outline: none;
        }

        .forgot-inline-box button {
          min-height: 42px;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(135deg, #2563eb, #7c3aed, #ec4899);
        }

        .forgot-inline-box button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .forgot-inline-success,
        .forgot-inline-error {
          display: block;
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.35;
        }

        .forgot-inline-success {
          color: #dcfce7;
          background: rgba(22, 163, 74, 0.16);
          border: 1px solid rgba(34, 197, 94, 0.28);
        }

        .forgot-inline-error {
          color: #fee2e2;
          background: rgba(220, 38, 38, 0.16);
          border: 1px solid rgba(248, 113, 113, 0.28);
        }
      `}</style>
    </div>
  );
}
