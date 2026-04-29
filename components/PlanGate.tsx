"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GateStatus = "loading" | "allowed" | "blocked";

export default function PlanGate() {
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    let alive = true;

    async function checkPlan() {
      try {
        const res = await fetch("/api/platform/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (alive) setStatus("allowed");
          return;
        }

        const data = await res.json();

        const source =
          data?.user ||
          data?.profile ||
          data?.account ||
          data?.membership ||
          data;

        const plan =
          source?.plan ||
          source?.plan_id ||
          source?.planName ||
          source?.subscription_plan ||
          source?.subscription?.plan ||
          source?.assinatura?.plano;

        const planStatus =
          source?.plan_status ||
          source?.subscription_status ||
          source?.subscription?.status ||
          source?.assinatura?.status;

        const blockedStatus = ["inactive", "canceled", "cancelled", "expired", "trial_expired", "none"];

        const hasPlan = Boolean(plan);
        const isBlockedByStatus = planStatus ? blockedStatus.includes(String(planStatus).toLowerCase()) : false;

        if (alive) {
          setStatus(!hasPlan || isBlockedByStatus ? "blocked" : "allowed");
        }
      } catch {
        if (alive) setStatus("allowed");
      }
    }

    checkPlan();

    return () => {
      alive = false;
    };
  }, []);

  if (status !== "blocked") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-5 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#070b1f] p-6 text-white shadow-2xl shadow-black/40 md:p-8">
        <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
          Acesso quase liberado
        </div>

        <h2 className="text-3xl font-black tracking-tight md:text-4xl">
          Escolha seu plano para continuar
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-300">
          Sua conta já foi criada. Agora escolha o plano ideal para liberar o dashboard,
          agentes, automações e recursos da plataforma.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.05] p-4">
          <p className="text-sm font-semibold text-slate-200">
            Depois de escolher o plano, o painel será liberado automaticamente conforme sua assinatura.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/plans"
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-4 text-center font-black text-white"
          >
            Ver planos
          </Link>

          <Link
            href="/sair"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center font-bold text-white"
          >
            Sair por enquanto
          </Link>
        </div>
      </div>
    </div>
  );
}
