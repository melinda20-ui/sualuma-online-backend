"use client";

import { FormEvent, useEffect, useState } from "react";

type ReferralLink = {
  id: string;
  code: string;
  fullUrl: string;
  destinationUrl: string;
  clicks: number;
  leads: number;
  conversions: number;
  revenueFormatted: string;
  payoutFormatted: string;
  createdAt: string;
};

type Summary = {
  links: number;
  clicks: number;
  leads: number;
  conversions: number;
  revenueFormatted: string;
  payoutFormatted: string;
};

export default function ClienteIndiquePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("https://sualuma.online/cadastro");
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadLinks(currentEmail: string) {
    if (!currentEmail || !currentEmail.includes("@")) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/cliente/indique/links?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Erro ao carregar links.");

      setLinks(data.links || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar links.");
    } finally {
      setLoading(false);
    }
  }

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/cliente/indique/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referrerName: name,
          referrerEmail: email,
          destinationUrl,
        }),
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Erro ao gerar link.");

      window.localStorage.setItem("sualuma_indique_name", name);
      window.localStorage.setItem("sualuma_indique_email", email);

      setMessage("Link criado com sucesso.");
      await loadLinks(email);
    } catch (err: any) {
      setError(err?.message || "Erro ao gerar link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Link copiado.");
  }

  useEffect(() => {
    const savedName = window.localStorage.getItem("sualuma_indique_name") || "";
    const savedEmail = window.localStorage.getItem("sualuma_indique_email") || "";

    setName(savedName);
    setEmail(savedEmail);

    if (savedEmail) {
      loadLinks(savedEmail);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-cyan-500/10">
          <div className="mb-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            Indique e ganhe
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Gere seu link de indicação da Sualuma
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            Compartilhe seu link com clientes, amigos ou parceiros. Quando alguém entra, vira lead,
            compra ou fecha serviço pela plataforma, o sistema registra o caminho da indicação.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Links</p>
            <strong className="mt-2 block text-3xl">{summary?.links || 0}</strong>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Cliques</p>
            <strong className="mt-2 block text-3xl">{summary?.clicks || 0}</strong>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Conversões</p>
            <strong className="mt-2 block text-3xl">{summary?.conversions || 0}</strong>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Prêmio previsto</p>
            <strong className="mt-2 block text-3xl">{summary?.payoutFormatted || "R$ 0,00"}</strong>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={createLink} className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-black">Criar link automático</h2>

            <label className="mt-5 block text-sm font-bold text-slate-200">
              Seu nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Maria Silva"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-slate-200">
              Seu email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-slate-200">
              Página de destino
              <input
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 shadow-xl shadow-cyan-500/20 disabled:opacity-60"
            >
              {loading ? "Gerando..." : "Gerar meu link"}
            </button>

            <button
              type="button"
              onClick={() => loadLinks(email)}
              disabled={loading || !email}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              Atualizar meus links
            </button>

            {message ? (
              <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}
          </form>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Meus links</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Acompanhe cliques, leads, conversões e valores rastreados.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {links.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-slate-300">
                  Nenhum link criado ainda. Preencha seu nome e email para gerar o primeiro.
                </div>
              ) : (
                links.map((link) => (
                  <article key={link.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          {link.code}
                        </p>
                        <p className="mt-2 break-all text-sm text-slate-200">{link.fullUrl}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          Destino: {link.destinationUrl}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyText(link.fullUrl)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950"
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                      <MiniMetric label="Cliques" value={link.clicks} />
                      <MiniMetric label="Leads" value={link.leads} />
                      <MiniMetric label="Conversões" value={link.conversions} />
                      <MiniMetric label="Gerado" value={link.revenueFormatted} />
                      <MiniMetric label="Prêmio" value={link.payoutFormatted} />
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-1 block text-sm text-white">{value}</strong>
    </div>
  );
}
