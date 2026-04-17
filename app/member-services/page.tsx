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

const projects = [
  {
    title: "Site institucional premium",
    provider: "Studio Prime Web",
    status: "Em andamento",
    statusClass: "text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/20",
    step: "Etapa atual: estruturação e layout",
    due: "Previsão: 4 dias",
  },
  {
    title: "Automação de leads no WhatsApp",
    provider: "Flow Automation",
    status: "Revisão",
    statusClass: "text-[#d7b8ff] bg-[#7A00FF]/10 border-[#7A00FF]/20",
    step: "Etapa atual: validação do webhook",
    due: "Previsão: 2 dias",
  },
  {
    title: "Pacote de edição de vídeos",
    provider: "VideoCraft Pro",
    status: "Aguardando briefing",
    statusClass: "text-white/80 bg-white/5 border-white/10",
    step: "Etapa atual: envio de materiais",
    due: "Sem prazo definido",
  },
];

export default function MemberServicesPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("luma_site_briefings") || "[]");
    setBriefings(saved);
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <SignedOut>
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-semibold">Área privada</h1>
          <p className="mt-4 text-white/60">
            Faça login para acessar seus serviços contratados.
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
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-5 md:px-6">
          <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/member-user"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80"
              >
                ←
              </Link>
              <div>
                <p className="text-sm font-semibold text-white">Área de membros</p>
                <p className="text-xs text-white/40">Serviços contratados</p>
              </div>
            </div>

            <button className="rounded-2xl bg-[#7A00FF] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(122,0,255,0.28)]">
              Novo briefing
            </button>
          </header>

          <section className="mb-8">
            <div className="mb-4 inline-flex rounded-full border border-[#7A00FF]/25 bg-[#7A00FF]/10 px-3 py-1 text-xs text-[#d7b8ff]">
              Escritório digital
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Acompanhe seus serviços e veja exatamente em que etapa tudo está.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
              Visualize projetos ativos, etapas, suporte, previsões e próximos passos
              sem precisar sair da plataforma.
            </p>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Projetos ativos</p>
              <p className="mt-3 text-3xl font-semibold text-white">3</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Em revisão</p>
              <p className="mt-3 text-3xl font-semibold text-[#d7b8ff]">1</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Suporte disponível</p>
              <p className="mt-3 text-3xl font-semibold text-[#00F0FF]">24/7</p>
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Briefings recebidos</h2>
              <p className="mt-2 text-sm text-white/55">
                Os formulários preenchidos aparecem aqui.
              </p>
            </div>

            {briefings.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-[#0b0d12] p-6 text-white/60">
                Nenhum briefing enviado ainda.
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

                    <h3 className="text-xl font-semibold text-white">
                      {briefing.segment || "Segmento não informado"}
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            {projects.map((project) => (
              <article
                key={project.title}
                className="rounded-[28px] border border-white/10 bg-[#0b0d12] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#7A00FF]/20 bg-[#7A00FF]/10 px-3 py-1 text-xs text-[#d7b8ff]">
                        {project.provider}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${project.statusClass}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-white">{project.title}</h2>
                    <p className="mt-2 text-sm text-white/55">{project.step}</p>
                    <p className="mt-1 text-sm text-white/40">{project.due}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/75">
                      Ver projeto
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/75">
                      Suporte
                    </button>
                    <button className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/10 px-3 py-2 text-xs text-[#00F0FF]">
                      Abrir área do projeto
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </SignedIn>
    </main>
  );
}
