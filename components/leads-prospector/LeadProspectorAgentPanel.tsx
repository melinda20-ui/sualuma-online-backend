"use client";

import { useEffect, useState } from "react";

type AgentPayload = {
  ok?: boolean;
  state?: {
    active?: boolean;
    target?: number;
    collected?: number;
    city?: string;
    niche?: string;
    lastRunAt?: string;
    lastMessage?: string;
    lastAgentAnswer?: string;
    needsConfig?: boolean;
  };
  stats?: {
    total?: number;
    revisar?: number;
    aprovado?: number;
    contato?: number;
    ganho?: number;
    descartado?: number;
  };
};

export default function LeadProspectorAgentPanel() {
  const [data, setData] = useState<AgentPayload | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/leads-prospector/agent", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const state = data?.state;
  const stats = data?.stats;

  return (
    <section className="mb-6 rounded-[28px] border border-pink-500/30 bg-[#0d0a14]/90 p-5 shadow-[0_0_40px_rgba(236,72,153,.14)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-300">
            Agente de Prospecção Ética
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {state?.active ? "Trabalhando no automático" : "Agente pausado"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Ele busca leads empresariais públicos em lotes, salva como <b>Revisar</b> e não faz disparo automático.
            Todo contato precisa de validação humana.
          </p>
        </div>

        <div className={`rounded-full px-4 py-2 text-sm font-bold ${
          state?.active
            ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
            : "border border-zinc-500/40 bg-zinc-500/10 text-zinc-300"
        }`}>
          {state?.active ? "● ativo" : "● pausado"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">Meta</p>
          <p className="mt-1 text-2xl font-black text-white">{state?.target ?? 1000}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">Coletados</p>
          <p className="mt-1 text-2xl font-black text-white">{stats?.total ?? state?.collected ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">Para revisar</p>
          <p className="mt-1 text-2xl font-black text-pink-300">{stats?.revisar ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">Última leitura</p>
          <p className="mt-1 text-sm font-bold text-white">
            {state?.lastRunAt ? new Date(state.lastRunAt).toLocaleString("pt-BR") : "—"}
          </p>
        </div>
      </div>

      {state?.needsConfig && (
        <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Falta configurar <b>GOOGLE_MAPS_API_KEY</b> ou <b>GOOGLE_PLACES_API_KEY</b> no .env.local para buscar leads reais.
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-pink-300">Status</p>
        <p className="mt-2 text-sm text-zinc-200">{state?.lastMessage || "Carregando status do agente..."}</p>
        {state?.lastAgentAnswer && (
          <p className="mt-3 text-sm text-zinc-400">{state.lastAgentAnswer}</p>
        )}
      </div>
    </section>
  );
}
