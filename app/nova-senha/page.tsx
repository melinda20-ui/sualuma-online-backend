"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data?.session));
      setReady(true);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (password.length < 6) {
        setError("A nova senha precisa ter pelo menos 6 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }

      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message || "Não foi possível atualizar sua senha.");
        return;
      }

      setMessage("Senha atualizada com sucesso. Entrando no seu portal...");

      window.setTimeout(() => {
        router.replace("/portal");
        router.refresh();
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="new-password-page">
      <section className="new-password-card">
        <p className="eyebrow">Sualuma Online</p>
        <h1>Criar nova senha</h1>

        {!ready && <p className="text">Validando seu link de recuperação...</p>}

        {ready && !hasSession && (
          <>
            <p className="text">
              Seu link de recuperação expirou ou não abriu corretamente. Peça um novo link na tela de login.
            </p>
            <a href="/login" className="back-login">
              Voltar para o login
            </a>
          </>
        )}

        {ready && hasSession && (
          <form onSubmit={handleSubmit}>
            <label>
              Nova senha
              <input
                type="password"
                placeholder="Digite sua nova senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            <label>
              Confirmar nova senha
              <input
                type="password"
                placeholder="Repita sua nova senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </section>

      <style>{`
        .new-password-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          color: #ffffff;
          background:
            radial-gradient(circle at 18% 15%, rgba(147, 51, 234, 0.32), transparent 28%),
            radial-gradient(circle at 82% 18%, rgba(56, 189, 248, 0.24), transparent 32%),
            linear-gradient(135deg, #020617 0%, #090a1f 48%, #020617 100%);
        }

        .new-password-card {
          width: min(100%, 440px);
          padding: 28px;
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(15, 23, 42, 0.88);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        h1 {
          margin: 0 0 16px;
          font-size: 32px;
          line-height: 1.05;
        }

        .text {
          color: rgba(226, 232, 240, 0.82);
          line-height: 1.5;
        }

        form {
          display: grid;
          gap: 14px;
        }

        label {
          display: grid;
          gap: 8px;
          color: rgba(226, 232, 240, 0.9);
          font-size: 14px;
          font-weight: 800;
        }

        input {
          min-height: 48px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.36);
          background: rgba(2, 6, 23, 0.72);
          color: #ffffff;
          padding: 12px 14px;
          outline: none;
        }

        button,
        .back-login {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          text-decoration: none;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(135deg, #2563eb, #7c3aed, #ec4899);
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .success,
        .error {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.35;
        }

        .success {
          color: #dcfce7;
          background: rgba(22, 163, 74, 0.16);
          border: 1px solid rgba(34, 197, 94, 0.28);
        }

        .error {
          color: #fee2e2;
          background: rgba(220, 38, 38, 0.16);
          border: 1px solid rgba(248, 113, 113, 0.28);
        }
      `}</style>
    </main>
  );
}
