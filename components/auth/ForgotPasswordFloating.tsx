"use client";

import { FormEvent, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordFloating() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        setError("Digite o e-mail da sua conta.");
        return;
      }

      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
      });

      if (error) {
        setError(error.message || "Não foi possível enviar o e-mail de recuperação.");
        return;
      }

      setMessage("Enviamos um link para você criar uma nova senha. Confira seu e-mail.");
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar recuperação de senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="forgot-password-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        Esqueci minha senha
      </button>

      {open && (
        <section className="forgot-password-panel">
          <button
            type="button"
            className="forgot-password-close"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          >
            ×
          </button>

          <p className="forgot-password-eyebrow">Recuperar acesso</p>
          <h2>Criar uma nova senha</h2>
          <p className="forgot-password-text">
            Digite o e-mail da sua conta. Vamos enviar um link seguro para você cadastrar uma senha nova.
          </p>

          <form onSubmit={handleReset}>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>

          {message && <div className="forgot-password-success">{message}</div>}
          {error && <div className="forgot-password-error">{error}</div>}
        </section>
      )}

      <style>{`
        .forgot-password-trigger {
          position: fixed;
          left: 18px;
          bottom: 18px;
          z-index: 99999;
          border: 1px solid rgba(125, 211, 252, 0.45);
          color: #ffffff;
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(147, 51, 234, 0.88)),
            rgba(15, 23, 42, 0.92);
          box-shadow:
            0 18px 44px rgba(37, 99, 235, 0.24),
            0 0 24px rgba(147, 51, 234, 0.18);
          border-radius: 999px;
          padding: 11px 15px;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          backdrop-filter: blur(14px);
        }

        .forgot-password-panel {
          position: fixed;
          left: 18px;
          bottom: 72px;
          z-index: 99999;
          width: min(92vw, 390px);
          padding: 22px;
          border-radius: 28px;
          color: #ffffff;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background:
            radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.22), transparent 32%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.46);
          backdrop-filter: blur(18px);
        }

        .forgot-password-close {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.10);
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
        }

        .forgot-password-eyebrow {
          margin: 0 0 8px;
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .forgot-password-panel h2 {
          margin: 0 0 8px;
          font-size: 24px;
          line-height: 1.1;
        }

        .forgot-password-text {
          margin: 0 0 16px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 14px;
          line-height: 1.45;
        }

        .forgot-password-panel form {
          display: grid;
          gap: 10px;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
        }

        .forgot-password-panel input {
          width: 100%;
          min-height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.36);
          background: rgba(2, 6, 23, 0.72);
          color: #ffffff;
          padding: 12px 14px;
          outline: none;
        }

        .forgot-password-panel button[type="submit"] {
          min-height: 46px;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(135deg, #2563eb, #7c3aed, #ec4899);
        }

        .forgot-password-panel button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .forgot-password-success,
        .forgot-password-error {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.35;
        }

        .forgot-password-success {
          color: #dcfce7;
          background: rgba(22, 163, 74, 0.16);
          border: 1px solid rgba(34, 197, 94, 0.28);
        }

        .forgot-password-error {
          color: #fee2e2;
          background: rgba(220, 38, 38, 0.16);
          border: 1px solid rgba(248, 113, 113, 0.28);
        }

        @media (max-width: 720px) {
          .forgot-password-trigger {
            left: 12px;
            right: 12px;
            bottom: 12px;
            width: calc(100vw - 24px);
          }

          .forgot-password-panel {
            left: 12px;
            right: 12px;
            bottom: 66px;
            width: auto;
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
}
