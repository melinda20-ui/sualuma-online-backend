"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Briefing = {
  id: number;
  createdAt: string;
  status: string;
  segment: string;
  currentSite: string;
  referenceSite: string;
  name: string;
  email: string;
  whatsapp: string;
  comments?: string[];
};

export default function ProviderServicesPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("luma_site_briefings") || "[]");
    setBriefings(saved);
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <SignedOut>
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-semibold">Área privada do prestador</h1>
          <p className="mt-4 text-white/60">
            Faça login para acessar os briefings e o fluxo de serviço.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 rounded-2xl bg-[#7A00FF] px-5 py-4 text-sm font-semibold text-white"
          >
            Entrar
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
          <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Prestação de serviços</p>
              <p className="mt-1 text-xs text-white/45">
                Painel interno de briefings, comentários e organização
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/member-user"
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80"
              >
                Voltar
              </Link>
              <button className="rounded-2xl bg-[#7A00FF] px-4 py-3 text-sm font-semibold text-white">
                Novo comentário interno
              </button>
            </div>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Briefings recebidos</p>
              <p className="mt-3 text-3xl font-semibold text-white">{briefings.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Novos hoje</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-200">3</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Em produção</p>
              <p className="mt-3 text-3xl font-semibold text-[#d7b8ff]">2</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Aguardando cliente</p>
              <p className="mt-3 text-3xl font-semibold text-white">1</p>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h1 className="text-3xl font-semibold md:text-5xl">
                Briefings para prestação de serviço
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
                Aqui aparecem os formulários preenchidos pelos clientes, junto com
                dados necessários para produção, contato e decisão visual.
              </p>
            </div>

            {briefings.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-[#0b0d12] p-6 text-white/60">
                Nenhum briefing disponível ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {briefings.map((briefing) => (
                  <article
                    key={briefing.id}
                    className="rounded-[28px] border border-white/10 bg-[#0b0d12] p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        {briefing.status}
                      </span>
                      <span className="text-xs text-white/40">{briefing.createdAt}</span>
                    </div>

                    <h2 className="text-xl font-semibold text-white">
                      {briefing.segment || "Segmento não informado"}
                    </h2>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                        <p className="font-medium text-white">Cliente</p>
                        <p className="mt-2">{briefing.name || "Não informado"}</p>
                        <p>{briefing.email || "Sem e-mail"}</p>
                        <p>{briefing.whatsapp || "Sem WhatsApp"}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                        <p className="font-medium text-white">Referências</p>
                        <p className="mt-2">Site atual: {briefing.currentSite || "Não informado"}</p>
                        <p>Referência desejada: {briefing.referenceSite || "Não informado"}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                        <p className="font-medium text-white">Comentários internos</p>
                        <p className="mt-2 text-white/60">
                          Espaço pronto para receber observações da equipe e andamento da produção.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/75">
                        Marcar como em análise
                      </button>
                      <button className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/75">
                        Adicionar comentário
                      </button>
                      <button className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-200">
                        Abrir projeto
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </SignedIn>
    </main>
  );
}

