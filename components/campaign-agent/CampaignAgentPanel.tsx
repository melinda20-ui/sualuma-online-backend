"use client";

import { useEffect, useState } from "react";

type CampaignState = {
  active?: boolean;
  launchOpen?: boolean;
  offerName?: string;
  targetSegment?: string;
  target?: number;
  lastRunAt?: string;
  lastMessage?: string;
  launchOpenedAt?: string;
  launchClosedAt?: string;
};

type CampaignData = {
  ok: boolean;
  state?: CampaignState;
  stats?: {
    totalMessages?: number;
    scheduled?: number;
    ready?: number;
    sent?: number;
    error?: number;
    contacts?: number;
  };
  recent?: Array<{
    id: string;
    email: string;
    name: string;
    subject: string;
    status: string;
    scheduledAt: string;
  }>;
  logs?: Array<any>;
  sendRealEmailsEnabled?: boolean;
};

function Card({ title, value, desc }: { title: string; value: any; desc?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      {desc ? <p className="mt-2 text-xs text-zinc-400">{desc}</p> : null}
    </div>
  );
}

export default function CampaignAgentPanel() {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/campaign-agent", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function action(action: string) {
    setRunning(action);
    setMessage("");

    try {
      const res = await fetch("/api/studio/campaign-agent-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setMessage(json.error || "Não consegui executar a ação.");
      } else {
        setMessage(json.message || json.state?.lastMessage || "Ação executada.");
      }

      await load();
    } catch (err: any) {
      setMessage(err?.message || "Erro inesperado.");
    } finally {
      setRunning(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const state = data?.state || {};
  const stats = data?.stats || {};
  const launchOpen = Boolean(state.launchOpen);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-zinc-300">
        Carregando Campaign Agent...
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl">
      <div className="rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 via-slate-950 to-cyan-500/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300">
          Campaign Agent · Lançamento Seguro
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">
              {launchOpen ? "Lançamento aberto" : "Lançamento fechado"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              Regra de segurança ativa: o agente pode estar preparado, mas os e-mails iniciais
              só serão preparados/enviados depois que você clicar em <b>Abrir lançamento</b>.
              Sem esse botão, nenhuma sequência inicial roda.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Status atual: {state.lastMessage || "Sem mensagem recente."}
            </p>
          </div>

          <div className={`rounded-2xl border p-4 text-center ${
            launchOpen
              ? "border-emerald-400/30 bg-emerald-400/10"
              : "border-amber-400/30 bg-amber-400/10"
          }`}>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">Trava do lançamento</p>
            <p className={`mt-2 text-2xl font-black ${launchOpen ? "text-emerald-300" : "text-amber-300"}`}>
              {launchOpen ? "ABERTO" : "FECHADO"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => action("start")}
            disabled={!!running}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
          >
            Preparar agente
          </button>

          <button
            onClick={() => action("open-launch")}
            disabled={!!running || launchOpen}
            className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-5 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-400/25 disabled:opacity-50"
          >
            Abrir lançamento
          </button>

          <button
            onClick={() => action("close-launch")}
            disabled={!!running || !launchOpen}
            className="rounded-full border border-rose-300/40 bg-rose-400/15 px-5 py-3 text-sm font-black text-rose-100 hover:bg-rose-400/25 disabled:opacity-50"
          >
            Fechar lançamento
          </button>

          <button
            onClick={() => action("run-batch")}
            disabled={!!running || !launchOpen}
            className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
          >
            Rodar rodada agora
          </button>

          <button
            onClick={() => action("pause")}
            disabled={!!running}
            className="rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-50"
          >
            Pausar agente
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-zinc-200">
            {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Card title="Contatos na sequência" value={stats.contacts ?? 0} />
        <Card title="E-mails prontos" value={stats.ready ?? 0} />
        <Card title="Enviados" value={stats.sent ?? 0} />
        <Card title="Agendados" value={stats.scheduled ?? 0} />
        <Card title="Erros" value={stats.error ?? 0} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Modo de envio</p>
        <p className="mt-2 text-sm text-zinc-300">
          Envio real:{" "}
          <b>
            {data?.sendRealEmailsEnabled
              ? "ativado via CAMPAIGN_AGENT_SEND_ENABLED=true"
              : "modo seguro/draft ativo"}
          </b>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Últimos e-mails na fila</p>
        <div className="mt-3 space-y-2">
          {(data?.recent || []).length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum e-mail na fila ainda.</p>
          ) : (
            data?.recent?.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-bold">{item.subject}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {item.name} · {item.email} · {item.status}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
