"use client";

import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import Script from "next/script";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
  }
}

declare global {
  interface Window {
    onRecaptchaSuccess?: (token: string) => void;
    onRecaptchaExpired?: () => void;
    grecaptcha?: {
      reset?: () => void;
    };
  }
}

type Mode = "login" | "signup";


async function notifyLoginRateLimitByEmail(emailValue: string) {
  const email = String(emailValue || "").trim().toLowerCase();

  if (!email || !email.includes("@")) return;

  try {
    await fetch("/api/auth/login-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        source: "login-page-rate-limit",
      }),
    });
  } catch (error) {
    console.error("[login-alert] Falha ao avisar por e-mail:", error);
  }
}

function isLoginRateLimitError(message?: string | null) {
  const text = String(message || "").toLowerCase();

  return (
    text.includes("request rate limit") ||
    text.includes("rate limit") ||
    text.includes("too many requests") ||
    text.includes("too many") ||
    text.includes("muitas tentativas") ||
    text.includes("limite")
  );
}


export default function LoginPage() {
  const router = useRouter();

  // REDIRECT_LOGIN_PORTAL: usuário logado entra direto no portal
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        router.replace("/portal");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/portal");
      }
    });

    return () => {
      data?.subscription?.unsubscribe?.();
    };
  }, [router]);



  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const columns = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const chunk = Array.from({ length: 120 }, () =>
        Math.random() > 0.5 ? "1" : "0"
      ).join("");
      return {
        id: i,
        left: `${i * 3.7}%`,
        delay: `${(i % 9) * 0.7}s`,
        duration: `${12 + (i % 7) * 2}s`,
        content: `${chunk} ${chunk} ${chunk}`,
      };
    });
  }, []);

  const corridorSquares = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  useEffect(() => {
    window.onRecaptchaSuccess = (token: string) => setRecaptchaToken(token);
    window.onRecaptchaExpired = () => setRecaptchaToken("");

    return () => {
      delete window.onRecaptchaSuccess;
      delete window.onRecaptchaExpired;
    };
  }, []);


  // LUMA_PORTAL_REDIRECT: se a pessoa já estiver logada ou acabar de logar, manda para o portal
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session && window.location.pathname === "/login") {
        window.location.replace("/portal");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN" && window.location.pathname === "/login") {
        window.location.replace("/portal");
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleOAuth(provider: "google" | "apple") {
    try {
      setError("");
      setMessage("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/portal`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao iniciar login social.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!recaptchaToken) {
        setError("Confirme o reCAPTCHA antes de continuar.");
        return;
      }

      const recaptchaRes = await fetch("/api/recaptcha/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      const recaptchaData = await recaptchaRes.json();

      if (!recaptchaRes.ok || !recaptchaData.ok) {
        setRecaptchaToken("");
        try {
          window.grecaptcha?.reset?.();
        } catch {}

        setError(
          recaptchaData?.error ||
            "Não conseguimos confirmar que você não é um robô. Tente novamente."
        );
        return;
      }

      if (!form.email || !form.password) {
        setError("Preencha e-mail e senha.");
        return;
      }

      if (mode === "signup") {
        if (!form.name.trim()) {
          setError("Informe seu nome.");
          return;
        }

        if (form.password.length < 6) {
          setError("A senha precisa ter pelo menos 6 caracteres.");
          return;
        }

        if (form.password !== form.confirmPassword) {
          setError("As senhas não coincidem.");
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
            data: {
              full_name: form.name,
            },
          },
        });

        if (!error) {
          window.location.href = `/confirme-seu-email?email=${encodeURIComponent((document.querySelector('input[type="email"]') as HTMLInputElement | null)?.value || "")}`;
          return;
        }


        if (error) {
          setError(error.message);
          return;
        }

        setMessage(
          "Cadastro realizado. Verifique seu e-mail para confirmar a conta."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        router.push("/portal");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js" strategy="lazyOnload" />

      <main className="login-page">
        <div className="bg-photo" />
        <div className="bg-dark" />

        <div className="infinite-corridor">
          <div className="corridor-center-glow" />
          {corridorSquares.map((square) => (
            <span
              key={square}
              className="corridor-square"
              style={{ animationDelay: `${square * 0.38}s` }}
            />
          ))}

          <span className="corridor-light red" />
          <span className="corridor-light yellow" />
          <span className="corridor-light pink" />
          <span className="corridor-light blue" />
          <span className="corridor-light green" />
        </div>

        <div className="code-rain">
          {columns.map((col) => (
            <span
              key={col.id}
              className="rain-col"
              style={{
                left: col.left,
                animationDelay: col.delay,
                animationDuration: col.duration,
              }}
            >
              {col.content}
            </span>
          ))}
        </div>

        <section className="login-shell">
          <div className="left-panel">
            <div className="brand-box">
              <span className="badge">SUALUMA OS</span>

              <div className="hero-block">
                <div className="title-row">
                  <div className="robot-column">
                    <div className="robot-bubble">
                      <span className="bubble-line line1">Olá ✨</span>
                      <span className="bubble-line line2">
                        Esse é o seu sistema inteligente
                      </span>
                      <span className="bubble-line line3">
                        Faça login para entrar
                      </span>
                    </div>

                    <div className="robot-wrap">
                      <div className="robot-shadow" />

                      <div className="robot">
                        <div className="robot-head">
                          <div className="robot-antenna">
                            <span className="antenna-ball" />
                          </div>

                          <div className="robot-face">
                            <span className="robot-eye left">
                              <i />
                            </span>
                            <span className="robot-eye right">
                              <i />
                            </span>
                          </div>
                        </div>

                        <div className="robot-body">
                          <span className="robot-neck" />
                          <span className="robot-core" />
                          <span className="robot-arm arm-left" />
                          <span className="robot-arm arm-right" />
                          <span className="robot-leg leg-left" />
                          <span className="robot-leg leg-right" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hero-copy">
                    <div className="title-stack">
                      <h1>
                        Seu sistema inteligente para automação, agentes e
                        crescimento.
                      </h1>
                      <p>
                        Entre no seu ecossistema digital para acessar chats,
                        automações, clientes, agentes, conteúdos e seu painel de
                        operação.
                      </p>
                    </div>

                    <div className="mini-features">
                      <div className="mini-card">
                        <strong>Agentes de IA</strong>
                        <span>Comande inteligência, atendimento e execução.</span>
                      </div>
                      <div className="mini-card">
                        <strong>Projetos e Clientes</strong>
                        <span>Organize entregas, processos e comunicação.</span>
                      </div>
                      <div className="mini-card">
                        <strong>Automações</strong>
                        <span>Faça o sistema trabalhar por você.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="login-card">
              <div className="tabs">
                <button
                  type="button"
                  className={mode === "login" ? "tab active" : "tab"}
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setMessage("");
                  }}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={mode === "signup" ? "tab active" : "tab"}
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                >
                  Criar conta
                </button>
              </div>

              <div className="card-header">
                <h2>{mode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2>
                <p>
                  {mode === "login"
                    ? "Use seu e-mail e senha ou entre com sua conta social."
                    : "Cadastre-se para entrar no ecossistema da Sualuma."}
                </p>
              </div>

              <div className="socials">
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => handleOAuth("google")}
                >
                  <span>G</span>
                  Entrar com Google
                </button>
              </div>

              <div className="divider">
                <span>ou continue com e-mail</span>
              </div>

              <form className="form" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="field">
                    <label>Nome</label>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="field">
                  <label>E-mail</label>
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label>Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                </div>

                {mode === "signup" && (
                  <div className="field">
                    <label>Confirmar senha</label>
                    <input
                      type="password"
                      placeholder="Repita sua senha"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="captcha-wrap">
                  {recaptchaSiteKey ? (
                    <div className="recaptcha-panel">
                      <div
                        className="g-recaptcha"
                        data-sitekey={recaptchaSiteKey}
                        data-theme="dark"
                        data-callback="onRecaptchaSuccess"
                        data-expired-callback="onRecaptchaExpired"
                      />
                    </div>
                  ) : (
                    <div className="captcha-fallback">
                      Configure <strong>NEXT_PUBLIC_RECAPTCHA_SITE_KEY</strong> para exibir o Google reCAPTCHA.
                    </div>
                  )}
                </div>

                {error && <div className="feedback error">{error}</div>}
                {message && <div className="feedback success">{message}</div>}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading
                    ? "Processando..."
                    : mode === "login"
                    ? "Entrar"
                    : "Criar conta"}
                </button>
              </form>

              <div className="bottom-text">
                {mode === "login" ? (
                  <>
                    Ainda não tem conta?{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setMode("signup")}
                    >
                      Cadastre-se
                    </button>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setMode("login")}
                    >
                      Fazer login
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .login-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: #040611;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .bg-photo {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(125deg, rgba(3, 6, 16, 0.92), rgba(6, 10, 26, 0.64)),
            url("/images/login-bg.jpg") center center / cover no-repeat;
          transform: scale(1.05);
          filter: saturate(1.2) contrast(1.04);
        }

        .bg-dark {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(255, 0, 128, 0.14), transparent 22%),
            radial-gradient(circle at 80% 15%, rgba(0, 132, 255, 0.18), transparent 26%),
            radial-gradient(circle at 50% 90%, rgba(0, 255, 145, 0.12), transparent 24%),
            linear-gradient(to bottom, rgba(2, 4, 12, 0.28), rgba(2, 4, 12, 0.82));
        }

        .infinite-corridor {
          position: absolute;
          inset: -12%;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          perspective: 1200px;
        }

        .corridor-center-glow {
          position: absolute;
          left: 38%;
          top: 48%;
          width: 22vw;
          height: 22vw;
          transform: translate(-50%, -50%) rotate(45deg);
          background: radial-gradient(circle, rgba(255,255,255,0.18), rgba(66, 153, 255, 0.08) 35%, transparent 70%);
          filter: blur(24px);
          opacity: 0.9;
        }

        .corridor-square {
          position: absolute;
          left: 38%;
          top: 48%;
          width: 58vw;
          height: 58vw;
          transform: translate(-50%, -50%) rotate(45deg) scale(1.9);
          border: 2px solid rgba(87, 173, 255, 0.18);
          box-shadow:
            0 0 40px rgba(0, 153, 255, 0.08),
            inset 0 0 60px rgba(255, 255, 255, 0.03);
          animation: corridorZoom 5.2s linear infinite;
          opacity: 0;
        }

        .corridor-light {
          position: absolute;
          left: 38%;
          top: 48%;
          width: 180vmax;
          height: 46vmax;
          transform: translate(-50%, -50%) rotate(-26deg) scale(1.2);
          filter: blur(34px);
          opacity: 0;
          mix-blend-mode: screen;
        }

        .corridor-light.red {
          background: linear-gradient(
            90deg,
            rgba(255, 52, 96, 0.65) 0%,
            rgba(255, 52, 96, 0.3) 28%,
            transparent 70%
          );
          animation: corridorBeam 18s linear infinite;
          animation-delay: 0s;
        }

        .corridor-light.yellow {
          background: linear-gradient(
            90deg,
            rgba(255, 210, 30, 0.7) 0%,
            rgba(255, 210, 30, 0.32) 28%,
            transparent 70%
          );
          animation: corridorBeam 18s linear infinite;
          animation-delay: 3.6s;
        }

        .corridor-light.pink {
          background: linear-gradient(
            90deg,
            rgba(255, 0, 140, 0.72) 0%,
            rgba(255, 0, 140, 0.32) 28%,
            transparent 70%
          );
          animation: corridorBeam 18s linear infinite;
          animation-delay: 7.2s;
        }

        .corridor-light.blue {
          background: linear-gradient(
            90deg,
            rgba(0, 149, 255, 0.74) 0%,
            rgba(0, 149, 255, 0.32) 28%,
            transparent 70%
          );
          animation: corridorBeam 18s linear infinite;
          animation-delay: 10.8s;
        }

        .corridor-light.green {
          background: linear-gradient(
            90deg,
            rgba(0, 255, 157, 0.65) 0%,
            rgba(0, 255, 157, 0.28) 28%,
            transparent 70%
          );
          animation: corridorBeam 18s linear infinite;
          animation-delay: 14.4s;
        }

        @keyframes corridorZoom {
          0% {
            transform: translate(-50%, -50%) rotate(45deg) scale(1.9);
            opacity: 0;
          }
          12% {
            opacity: 0.75;
          }
          100% {
            transform: translate(-50%, -50%) rotate(45deg) scale(0.08);
            opacity: 0;
          }
        }

        @keyframes corridorBeam {
          0%, 100% {
            transform: translate(-56%, -50%) rotate(-26deg) scale(1.4);
            opacity: 0;
          }
          8% {
            opacity: 0.8;
          }
          22% {
            transform: translate(-18%, -50%) rotate(-26deg) scale(0.35);
            opacity: 0;
          }
        }

        .code-rain {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          opacity: 0.16;
          z-index: 1;
        }

        .rain-col {
          position: absolute;
          top: -140%;
          width: 42px;
          white-space: pre-wrap;
          word-break: break-all;
          font-size: 12px;
          line-height: 12px;
          color: #8be9ff;
          text-shadow:
            0 0 10px rgba(0, 187, 255, 0.55),
            0 0 20px rgba(0, 187, 255, 0.28);
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes fall {
          from {
            transform: translateY(-120%);
          }
          to {
            transform: translateY(260%);
          }
        }

        .login-shell {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
          gap: 32px;
          padding: 36px;
        }

        .left-panel,
        .right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-box {
          width: 100%;
          max-width: 760px;
          background: rgba(7, 12, 30, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border-radius: 32px;
          padding: 34px;
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.38),
            inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(0, 163, 255, 0.16);
          border: 1px solid rgba(0, 163, 255, 0.42);
          color: #d0f4ff;
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .hero-block {
          width: 100%;
        }

        .title-row {
          display: grid;
          grid-template-columns: 190px 1fr;
          gap: 8px;
          align-items: start;
        }

        .robot-column {
          position: relative;
          min-height: 295px;
          z-index: 1;
        }

        .robot-bubble {
          position: absolute;
          top: 0;
          left: 0;
          width: 175px;
          min-height: 112px;
          border-radius: 22px;
          padding: 16px 16px 16px 18px;
          background: rgba(8, 14, 32, 0.92);
          border: 1px solid rgba(130, 216, 255, 0.22);
          box-shadow:
            0 16px 34px rgba(0, 0, 0, 0.28),
            0 0 30px rgba(0, 132, 255, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
        }

        .robot-bubble::after {
          content: "";
          position: absolute;
          bottom: -10px;
          right: 32px;
          width: 20px;
          height: 20px;
          background: rgba(8, 14, 32, 0.92);
          border-right: 1px solid rgba(130, 216, 255, 0.22);
          border-bottom: 1px solid rgba(130, 216, 255, 0.22);
          transform: rotate(45deg);
        }

        .bubble-line {
          display: block;
          opacity: 0;
          transform: translateY(8px);
          animation: bubbleTalk 8s infinite;
        }

        .bubble-line.line1 {
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          animation-delay: 0.15s;
        }

        .bubble-line.line2 {
          color: #8be9ff;
          font-size: 13px;
          line-height: 1.3;
          animation-delay: 0.55s;
        }

        .bubble-line.line3 {
          color: rgba(255, 255, 255, 0.86);
          font-size: 13px;
          line-height: 1.3;
          animation-delay: 0.95s;
        }

        @keyframes bubbleTalk {
          0%, 62%, 100% {
            opacity: 0;
            transform: translateY(8px);
          }
          10%, 48% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .robot-wrap {
          position: absolute;
          left: 10px;
          top: 108px;
          width: 170px;
          height: 178px;
          z-index: 1;
          animation: robotPeekCycle 8s infinite ease-in-out;
        }

        .robot-shadow {
          position: absolute;
          left: 52%;
          bottom: 8px;
          width: 88px;
          height: 22px;
          background: radial-gradient(circle, rgba(0, 0, 0, 0.5) 0%, transparent 70%);
          transform: translateX(-50%);
          filter: blur(7px);
          animation: shadowPulse 8s infinite ease-in-out;
        }

        .robot {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          animation: robotFloat 3.8s ease-in-out infinite;
        }

        .robot-head {
          position: absolute;
          left: 50%;
          top: 8px;
          width: 104px;
          height: 88px;
          transform: translateX(-50%) rotateX(8deg);
          border-radius: 28px;
          background: linear-gradient(180deg, #f4fbff 0%, #cfe6ff 52%, #9bbcff 100%);
          border: 2px solid rgba(255, 255, 255, 0.75);
          box-shadow:
            inset -12px -12px 20px rgba(70, 110, 255, 0.18),
            inset 10px 10px 14px rgba(255, 255, 255, 0.38),
            0 14px 30px rgba(0, 117, 255, 0.18);
        }

        .robot-head::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 22px;
          background: linear-gradient(145deg, rgba(255,255,255,0.16), transparent);
          pointer-events: none;
        }

        .robot-antenna {
          position: absolute;
          left: 50%;
          top: -20px;
          width: 4px;
          height: 22px;
          background: linear-gradient(180deg, #dff8ff, #9fbeff);
          transform: translateX(-50%);
          border-radius: 999px;
        }

        .antenna-ball {
          position: absolute;
          top: -8px;
          left: 50%;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #ff2f73;
          box-shadow: 0 0 18px rgba(255, 47, 115, 0.88);
          transform: translateX(-50%);
          animation: blinkLight 2s ease-in-out infinite;
        }

        .robot-face {
          position: absolute;
          inset: 18px 14px 16px;
          border-radius: 20px;
          background: linear-gradient(180deg, #0b1126, #121a33);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          overflow: hidden;
          box-shadow:
            inset 0 -8px 18px rgba(0, 0, 0, 0.24),
            inset 0 0 0 1px rgba(125, 211, 252, 0.08);
        }

        .robot-eye {
          position: relative;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(125, 211, 252, 0.14);
          border: 1px solid rgba(125, 211, 252, 0.32);
          overflow: hidden;
        }

        .robot-eye i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #77e3ff;
          box-shadow:
            0 0 14px rgba(119, 227, 255, 1),
            0 0 24px rgba(119, 227, 255, 0.48);
          transform: translate(-50%, -50%);
          animation: eyeMove 8s infinite;
        }

        .robot-eye.right {
          animation: eyeWinkRight 8s infinite;
          transform-origin: center;
        }

        .robot-body {
          position: absolute;
          left: 50%;
          top: 98px;
          width: 96px;
          height: 84px;
          transform: translateX(-50%) rotateX(6deg);
          border-radius: 26px;
          background: linear-gradient(180deg, #f3fbff 0%, #cbddff 56%, #9eb9ff 100%);
          border: 2px solid rgba(255, 255, 255, 0.75);
          box-shadow:
            inset -12px -10px 18px rgba(68, 105, 255, 0.14),
            inset 10px 10px 12px rgba(255, 255, 255, 0.36),
            0 18px 28px rgba(0, 123, 255, 0.12);
        }

        .robot-neck {
          position: absolute;
          top: -12px;
          left: 50%;
          width: 22px;
          height: 15px;
          transform: translateX(-50%);
          border-radius: 10px;
          background: linear-gradient(180deg, #eff8ff, #b3cbff);
          border: 1px solid rgba(255, 255, 255, 0.66);
        }

        .robot-core {
          position: absolute;
          left: 50%;
          top: 24px;
          width: 31px;
          height: 31px;
          border-radius: 999px;
          transform: translateX(-50%);
          background: radial-gradient(circle, #ffffff 0%, #77e3ff 38%, #245eff 100%);
          box-shadow:
            0 0 18px rgba(119, 227, 255, 0.76),
            0 0 28px rgba(36, 94, 255, 0.22);
        }

        .robot-arm,
        .robot-leg {
          position: absolute;
          background: linear-gradient(180deg, #f1fbff, #acc5ff);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.28);
        }

        .robot-arm {
          top: 16px;
          width: 14px;
          height: 58px;
          border-radius: 999px;
        }

        .arm-left {
          left: -12px;
          transform-origin: top center;
          transform: rotate(18deg);
        }

        .arm-right {
          right: -14px;
          transform-origin: top center;
          animation: armInvite 8s infinite ease-in-out;
        }

        .robot-leg {
          bottom: -30px;
          width: 14px;
          height: 42px;
          border-radius: 999px;
        }

        .leg-left {
          left: 24px;
        }

        .leg-right {
          right: 24px;
        }

        @keyframes robotPeekCycle {
          0% {
            transform: translateX(-58px) translateY(6px) scale(0.95);
            opacity: 0;
          }
          8% {
            transform: translateX(-18px) translateY(0) scale(1);
            opacity: 1;
          }
          18%, 44% {
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
          }
          56%, 70% {
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
          }
          86% {
            transform: translateX(-34px) translateY(3px) scale(0.97);
            opacity: 1;
          }
          100% {
            transform: translateX(-68px) translateY(6px) scale(0.92);
            opacity: 0;
          }
        }

        @keyframes robotFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes shadowPulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateX(-50%) scale(0.9);
            opacity: 0.28;
          }
        }

        @keyframes blinkLight {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) scale(0.82);
            opacity: 0.62;
          }
        }

        @keyframes armInvite {
          0%, 10% {
            transform: rotate(8deg);
          }
          16%, 22% {
            transform: rotate(-34deg);
          }
          28%, 34% {
            transform: rotate(-8deg);
          }
          40%, 46% {
            transform: rotate(-34deg);
          }
          52%, 100% {
            transform: rotate(8deg);
          }
        }

        @keyframes eyeMove {
          0%, 12% {
            transform: translate(-50%, -50%);
          }
          20%, 40% {
            transform: translate(-12%, -50%);
          }
          52%, 66% {
            transform: translate(-56%, -50%);
          }
          78%, 100% {
            transform: translate(-50%, -50%);
          }
        }

        @keyframes eyeWinkRight {
          0%, 57%, 100% {
            transform: scaleY(1);
          }
          60% {
            transform: scaleY(0.14);
          }
          63% {
            transform: scaleY(1);
          }
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          padding-top: 8px;
        }

        .title-stack {
          position: relative;
          z-index: 2;
          margin-left: -18px;
          padding-left: 18px;
        }

        .hero-copy h1 {
          font-size: 46px;
          line-height: 1.05;
          margin: 0 0 14px;
          text-shadow:
            0 0 24px rgba(0, 132, 255, 0.12),
            0 6px 18px rgba(0, 0, 0, 0.28);
        }

        .hero-copy p {
          color: rgba(255, 255, 255, 0.82);
          font-size: 16px;
          line-height: 1.65;
          margin: 0 0 24px;
          max-width: 520px;
        }

        .mini-features {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .mini-card {
          padding: 16px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
        }

        .mini-card strong {
          display: block;
          margin-bottom: 6px;
          color: #fff;
        }

        .mini-card span {
          color: rgba(255, 255, 255, 0.76);
          font-size: 14px;
        }

        .login-card {
          width: 100%;
          max-width: 470px;
          border-radius: 28px;
          padding: 28px;
          background: rgba(8, 14, 34, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.09);
          backdrop-filter: blur(16px);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.46),
            0 0 40px rgba(0, 110, 255, 0.06);
        }

        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px;
          border-radius: 16px;
          margin-bottom: 22px;
        }

        .tab {
          height: 44px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: rgba(255, 255, 255, 0.78);
          font-weight: 700;
          cursor: pointer;
        }

        .tab.active {
          background: linear-gradient(135deg, #006eff, #8b2cff);
          color: #fff;
          box-shadow: 0 12px 30px rgba(0, 110, 255, 0.28);
        }

        .card-header h2 {
          margin: 0 0 6px;
          font-size: 28px;
        }

        .card-header p {
          margin: 0 0 18px;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.5;
          font-size: 14px;
        }

        .socials {
          display: grid;
          gap: 10px;
        }

        .social-btn {
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .social-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
        }

        .social-btn span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          font-size: 18px;
        }

        .divider {
          position: relative;
          margin: 18px 0;
          text-align: center;
        }

        .divider::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }

        .divider span {
          position: relative;
          z-index: 1;
          background: rgba(8, 14, 34, 0.96);
          padding: 0 12px;
          color: rgba(255, 255, 255, 0.56);
          font-size: 13px;
        }

        .form {
          display: grid;
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.84);
        }

        .field input {
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          outline: none;
          padding: 0 14px;
          font-size: 15px;
        }

        .field input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .field input:focus {
          border-color: rgba(0, 166, 255, 0.78);
          box-shadow: 0 0 0 4px rgba(0, 166, 255, 0.13);
        }

        .captcha-wrap {
          margin-top: 4px;
        }

        .recaptcha-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 82px;
          border-radius: 16px;
          border: 1px solid rgba(125, 211, 252, 0.22);
          background: rgba(255, 255, 255, 0.055);
          padding: 12px;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.025),
            0 0 28px rgba(0, 149, 255, 0.08);
          overflow: hidden;
        }

        .captcha-fallback {
          border-radius: 14px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          padding: 14px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.72);
          background: rgba(255, 255, 255, 0.03);
        }

        .feedback {
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 14px;
        }

        .feedback.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #fecaca;
        }

        .feedback.success {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.28);
          color: #bbf7d0;
        }

        .submit-btn {
          height: 50px;
          border-radius: 15px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #006eff, #9a21ff);
          box-shadow: 0 18px 34px rgba(0, 110, 255, 0.28);
          transition: 0.2s ease;
        }

        .submit-btn:hover {
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .bottom-text {
          margin-top: 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
        }

        .text-link {
          background: none;
          border: none;
          color: #83e7ff;
          cursor: pointer;
          font-weight: 700;
        }

        @media (max-width: 1100px) {
          .login-shell {
            grid-template-columns: 1fr;
            padding: 24px 16px;
          }

          .left-panel {
            display: none;
          }

          .login-card {
            max-width: 100%;
          }
        }

        @media (max-width: 680px) {
          .login-card {
            padding: 22px;
            border-radius: 22px;
          }

          .card-header h2 {
            font-size: 24px;
          }
        }

        /* MOBILE: mostrar robô e texto também no celular */
        @media (max-width: 1100px) {
          .login-shell {
            grid-template-columns: 1fr;
            padding: 18px 14px 28px;
            gap: 18px;
            align-items: start;
          }

          .left-panel {
            display: flex !important;
            width: 100%;
          }

          .right-panel {
            width: 100%;
          }

          .brand-box {
            max-width: 470px;
            padding: 20px;
            border-radius: 24px;
          }

          .badge {
            margin-bottom: 12px;
            font-size: 10px;
            padding: 7px 11px;
          }

          .title-row {
            grid-template-columns: 1fr;
            gap: 8px;
            align-items: start;
          }

          .robot-column {
            min-height: auto;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-bottom: 8px;
          }

          .robot-bubble {
            position: relative !important;
            width: 210px;
            min-height: auto;
            padding: 10px 14px;
            border-radius: 16px;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            margin: 0 auto 0 auto;
          }

          .robot-bubble .line1 {
            font-size: 13px;
          }

          .robot-bubble .line2,
          .robot-bubble .line3 {
            font-size: 11px;
          }

          .robot-wrap {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: scale(0.9) !important;
            transform-origin: top center;
            width: 104px;
            height: 110px;
            scale: unset;
            margin-top: -10px;
          }

          .hero-copy {
            padding-top: 0;
          }

          .title-stack {
            margin-left: 0;
            padding-left: 0;
          }

          .hero-copy h1 {
            font-size: 28px;
            line-height: 1.08;
            margin-bottom: 10px;
          }

          .hero-copy p {
            font-size: 13px;
            line-height: 1.45;
            margin-bottom: 0;
          }

          .mini-features {
            display: none;
          }

          .login-card {
            max-width: 470px;
          }
        }

        @media (max-width: 520px) {
          .title-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .brand-box {
            padding: 16px;
          }

          .hero-copy h1 {
            font-size: 24px;
          }

          .hero-copy p {
            font-size: 12px;
          }

          .robot-bubble {
            transform: scale(0.62);
          }

          .robot-wrap {
            scale: 0.62;
            top: 64px;
            left: -4px;
          }
        }


        /* LOGIN PERFORMANCE EXTRA: visual bonito, menos travamento */
        .login-page *,
        .login-page *::before,
        .login-page *::after {
          backface-visibility: hidden;
        }

        .matrix-rain,
        .code-rain,
        .falling-code {
          opacity: 0.14 !important;
          filter: none !important;
          will-change: auto !important;
        }

        .beam,
        .light-beam,
        .orb,
        .glow,
        .ambient {
          filter: blur(22px) !important;
        }

        .login-card,
        .brand-box {
          backdrop-filter: blur(8px) !important;
        }

        @media (min-width: 901px) {
          .matrix-rain,
          .code-rain,
          .falling-code {
            animation-duration: 42s !important;
          }
        }

        @media (max-width: 900px) {
          .matrix-rain,
          .code-rain,
          .falling-code {
            display: none !important;
          }

          .beam,
          .light-beam,
          .orb,
          .glow,
          .ambient {
            filter: blur(16px) !important;
          }
        }


        /* LOGIN LIGHT MODE: mantém o visual, mas reduz travamento */
        .login-page *,
        .login-page *::before,
        .login-page *::after {
          backface-visibility: hidden;
        }

        .login-page {
          transform: translateZ(0);
        }

        .login-card,
        .brand-box,
        .auth-card,
        .glass-card {
          backdrop-filter: blur(6px) !important;
          -webkit-backdrop-filter: blur(6px) !important;
          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }

        .beam,
        .light-beam,
        .orb,
        .glow,
        .ambient,
        .corridor-glow {
          filter: blur(16px) !important;
          opacity: 0.55 !important;
          will-change: transform, opacity;
        }

        .matrix-rain,
        .code-rain,
        .falling-code,
        .code-column {
          opacity: 0.16 !important;
          filter: none !important;
          text-shadow: none !important;
          will-change: transform;
        }

        .robot,
        .robot-wrap,
        .robot-bubble,
        .bot,
        .bot-wrap {
          will-change: transform, opacity;
        }

        @media (min-width: 900px) {
          .matrix-rain,
          .code-rain,
          .falling-code,
          .code-column {
            animation-duration: 38s !important;
          }

          .beam,
          .light-beam,
          .corridor,
          .diagonal-corridor,
          .infinite-corridor {
            animation-duration: 14s !important;
          }
        }

        @media (max-width: 700px) {
          .beam,
          .light-beam,
          .orb,
          .glow,
          .ambient,
          .corridor-glow {
            filter: blur(10px) !important;
            opacity: 0.42 !important;
          }

          .matrix-rain,
          .code-rain,
          .falling-code,
          .code-column {
            opacity: 0.08 !important;
          }
        }


        /* LOGIN TURBO MODE: mais rápido sem apagar o design */
        .login-page {
          isolation: isolate;
          contain: paint;
        }

        .login-card,
        .brand-box,
        .auth-card,
        .glass-card {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: rgba(8, 13, 28, 0.84) !important;
        }

        .orb,
        .glow,
        .ambient,
        .beam,
        .light-beam,
        .corridor-glow {
          filter: blur(6px) !important;
          opacity: 0.34 !important;
        }

        .matrix-rain span:nth-child(n+16),
        .code-rain span:nth-child(n+16),
        .falling-code span:nth-child(n+16),
        .code-column:nth-child(n+10) {
          display: none !important;
        }

        .matrix-rain,
        .code-rain,
        .falling-code,
        .code-column {
          opacity: 0.1 !important;
          animation-timing-function: linear !important;
        }

        .robot,
        .robot-wrap,
        .robot-bubble,
        .bot,
        .bot-wrap {
          transform: translateZ(0);
        }

        @media (min-width: 900px) {
          .matrix-rain,
          .code-rain,
          .falling-code,
          .code-column {
            animation-duration: 55s !important;
          }

          .beam,
          .light-beam,
          .corridor,
          .diagonal-corridor,
          .infinite-corridor {
            animation-duration: 24s !important;
          }
        }

        @media (max-width: 700px) {
          .matrix-rain span:nth-child(n+9),
          .code-rain span:nth-child(n+9),
          .falling-code span:nth-child(n+9),
          .code-column:nth-child(n+6) {
            display: none !important;
          }

          .orb,
          .glow,
          .ambient,
          .beam,
          .light-beam,
          .corridor-glow {
            filter: blur(4px) !important;
            opacity: 0.28 !important;
          }
        }

      `}</style>
    </>
  );
}
