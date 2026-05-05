"use client";

import React, { useEffect, useMemo, useState } from "react";

type CheckStatus = "ok" | "warn" | "critical";

type Check = {
  area: string;
  title: string;
  status: CheckStatus;
  description: string;
  action?: string;
};

type PlanReport = {
  expected: {
    id: string;
    area: string;
    label: string;
    price_cents: number;
    billing: "monthly" | "one_time" | "free";
    description: string;
    expected_entitlements: string[];
    expected_agents: string[];
  };
  found: boolean;
  matchedPlan: any;
  priceOk: boolean;
  activeOk: boolean;
  entitlements: Array<{ key: string; value: any }>;
  agents: Array<{ agent_key: string; agent_name: string; active: boolean }>;
  missingEntitlements: string[];
  missingAgents: string[];
  status: CheckStatus;
};

type Diagnosis = {
  ok: boolean;
  updatedAt: string;
  score: number;
  totals: {
    total: number;
    ok: number;
    warn: number;
    critical: number;
  };
  checks: Check[];
  supabase: {
    connected: boolean;
    authUserCount: number | null;
    allPlansFound: any[];
    plansReport: PlanReport[];
  };
};

const statusLabel: Record<CheckStatus, string> = {
  ok: "Pronto",
  warn: "Em andamento",
  critical: "Crítico",
};

function money(cents: number) {
  return `R$ ${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")}`;
}

function billingLabel(plan: PlanReport["expected"]) {
  if (plan.billing === "monthly") return "/mês";
  if (plan.billing === "one_time") return "único";
  return "grátis";
}

export default function UsuariosDiagnosticoPage() {
  const [data, setData] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDiagnosis() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/studio/usuarios-diagnostico", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("A API de diagnóstico não respondeu corretamente.");
      }

      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiagnosis();
  }, []);

  const grouped = useMemo<Record<string, Check[]>>(() => {
    const result: Record<string, Check[]> = {};

    for (const check of data?.checks || []) {
      if (!result[check.area]) result[check.area] = [];
      result[check.area].push(check);
    }

    return result;
  }, [data]);

  const plans = data?.supabase?.plansReport || [];

  const planStats = useMemo(() => {
    return plans.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      { total: 0, ok: 0, warn: 0, critical: 0 }
    );
  }, [plans]);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Sualuma Studio</p>
          <h1>Central de Usuários</h1>
          <p className="subtitle">
            Diagnóstico real de planos, usuários, Supabase, Stripe, Mia, agentes,
            permissões e acessos da plataforma.
          </p>
        </div>

        <button className="refreshButton" onClick={loadDiagnosis}>
          {loading ? "Atualizando..." : "Atualizar diagnóstico"}
        </button>
      </section>

      {error && (
        <section className="errorBox">
          <strong>Erro no diagnóstico</strong>
          <span>{error}</span>
        </section>
      )}

      <section className="diagnosticGrid">
        <article className="mainCard">
          <div className="cardTop">
            <div>
              <p className="eyebrow">Diagnóstico principal</p>
              <h2>
                {loading
                  ? "Investigando acessos..."
                  : data?.totals.critical
                  ? "Existem acessos críticos para configurar."
                  : data?.totals.warn
                  ? "A base está funcionando, mas existem ajustes."
                  : "A área de acessos parece pronta."}
              </h2>
            </div>

            <div
              className="scoreCircle"
              style={{
                background: `conic-gradient(#00e7ff ${
                  data?.score || 0
                }%, rgba(255,255,255,.08) 0)`,
              }}
            >
              <span>{data?.score ?? "--"}%</span>
            </div>
          </div>

          <p className="mainText">
            Agora esta tela investiga todos os planos principais: Básico, Prime,
            Premium, Pro, Gratuito Prestador, Pacote de Propostas e Prestador
            Prioritário.
          </p>

          <div className="chips">
            <span>
              Atualizado:{" "}
              {data?.updatedAt
                ? new Date(data.updatedAt).toLocaleString("pt-BR")
                : "--"}
            </span>
            <span>
              Supabase: {data?.supabase?.connected ? "conectado" : "pendente"}
            </span>
            <span>Usuários Auth: {data?.supabase?.authUserCount ?? "--"}</span>
          </div>
        </article>

        <article className="metricCard critical">
          <span>Críticos</span>
          <strong>{data?.totals.critical ?? "--"}</strong>
          <small>Resolver primeiro</small>
        </article>

        <article className="metricCard warn">
          <span>Alertas</span>
          <strong>{data?.totals.warn ?? "--"}</strong>
          <small>Revisar antes do lançamento</small>
        </article>

        <article className="metricCard ok">
          <span>Prontos</span>
          <strong>{data?.totals.ok ?? "--"}</strong>
          <small>Funcionando</small>
        </article>
      </section>

      <section className="summaryGrid">
        <article className="glassCard">
          <p className="eyebrow">Planos investigados</p>
          <h3>{planStats.total || "--"}</h3>
          <p>Planos esperados pelo modelo atual.</p>
        </article>

        <article className="glassCard">
          <p className="eyebrow">Planos prontos</p>
          <h3>{planStats.ok}</h3>
          <p>Encontrados com preço, permissões e agentes esperados.</p>
        </article>

        <article className="glassCard">
          <p className="eyebrow">Planos com ajuste</p>
          <h3>{planStats.warn}</h3>
          <p>Existem, mas faltam permissões, agentes ou preço correto.</p>
        </article>

        <article className="glassCard">
          <p className="eyebrow">Planos ausentes</p>
          <h3>{planStats.critical}</h3>
          <p>Ainda não foram confirmados na tabela plans.</p>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Investigação dos planos</p>
            <h2>Mapa real de planos e acessos</h2>
          </div>
        </div>

        {loading && <p className="empty">Carregando investigação dos planos...</p>}

        <div className="plansGrid">
          {plans.map((plan) => (
            <article className={`planCard ${plan.status}`} key={plan.expected.id}>
              <div className="planTop">
                <div>
                  <span className="areaPill">{plan.expected.area}</span>
                  <h3>{plan.expected.label}</h3>
                  <p>{plan.expected.description}</p>
                </div>

                <span className="statusPill">{statusLabel[plan.status]}</span>
              </div>

              <div className="priceLine">
                <strong>{money(plan.expected.price_cents)}</strong>
                <span>{billingLabel(plan.expected)}</span>
              </div>

              <div className="planFacts">
                <div>
                  <span>No Supabase</span>
                  <strong>{plan.found ? "Encontrado" : "Não encontrado"}</strong>
                </div>

                <div>
                  <span>Preço</span>
                  <strong>{plan.priceOk ? "OK" : "Ajustar"}</strong>
                </div>

                <div>
                  <span>Permissões</span>
                  <strong>{plan.entitlements.length}</strong>
                </div>

                <div>
                  <span>Agentes</span>
                  <strong>{plan.agents.length}</strong>
                </div>
              </div>

              {plan.matchedPlan && (
                <div className="matchedBox">
                  <span>ID encontrado</span>
                  <code>{plan.matchedPlan.id}</code>
                  <span>Nome encontrado</span>
                  <code>{plan.matchedPlan.name || "sem nome"}</code>
                </div>
              )}

              <div className="missingBox">
                <h4>Faltando configurar</h4>

                {!plan.found && (
                  <p>• Criar este plano na tabela plans com id sugerido: {plan.expected.id}</p>
                )}

                {plan.found && !plan.priceOk && (
                  <p>
                    • Corrigir preço para {money(plan.expected.price_cents)}{" "}
                    {billingLabel(plan.expected)}
                  </p>
                )}

                {plan.missingEntitlements.map((item) => (
                  <p key={item}>• Permissão: {item}</p>
                ))}

                {plan.missingAgents.map((item) => (
                  <p key={item}>• Agente: {item}</p>
                ))}

                {plan.found &&
                  plan.priceOk &&
                  plan.missingEntitlements.length === 0 &&
                  plan.missingAgents.length === 0 &&
                  plan.status !== "ok" && (
                    <p>
                      • Catálogo pronto. Falta validar compra → assinatura →
                      permissões → bloqueio real nas telas.
                    </p>
                  )}

                {plan.found &&
                  plan.priceOk &&
                  plan.missingEntitlements.length === 0 &&
                  plan.missingAgents.length === 0 &&
                  plan.status === "ok" && (
                    <p className="done">✓ Catálogo e fluxo operacional confirmados.</p>
                  )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Diagnóstico completo</p>
            <h2>Checklist vivo da plataforma</h2>
          </div>
        </div>

        {!loading &&
          Object.entries(grouped).map(([area, items]) => (
            <div className="areaBlock" key={area}>
              <h3>{area}</h3>

              <div className="checkList">
                {items.map((check) => (
                  <div className={`checkRow ${check.status}`} key={`${area}-${check.title}`}>
                    <div>
                      <strong>{check.title}</strong>
                      <p>{check.description}</p>
                      {check.action && <small>{check.action}</small>}
                    </div>

                    <span>{statusLabel[check.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #05020c;
        }

        .page {
          min-height: 100vh;
          padding: 36px;
          color: #fff;
          background:
            radial-gradient(circle at 20% 10%, rgba(0, 231, 255, .26), transparent 32%),
            radial-gradient(circle at 80% 0%, rgba(139, 92, 246, .30), transparent 34%),
            linear-gradient(135deg, #080014 0%, #100036 46%, #07123d 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #68f4ff;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        h1, h2, h3, h4, p {
          margin-top: 0;
        }

        h1 {
          margin-bottom: 8px;
          font-size: clamp(42px, 7vw, 78px);
          letter-spacing: -0.07em;
          line-height: .9;
        }

        .subtitle {
          max-width: 860px;
          color: rgba(255,255,255,.72);
          font-size: 16px;
          line-height: 1.6;
        }

        .refreshButton {
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          padding: 14px 20px;
          color: #06111f;
          background: linear-gradient(135deg, #00e7ff, #8b5cf6);
          box-shadow: 0 18px 42px rgba(0, 231, 255, .22);
          font-weight: 950;
          cursor: pointer;
          white-space: nowrap;
        }

        .errorBox {
          display: grid;
          gap: 6px;
          margin-bottom: 22px;
          padding: 18px 20px;
          border: 1px solid rgba(248, 113, 113, .5);
          border-radius: 24px;
          background: rgba(127, 29, 29, .28);
        }

        .diagnosticGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 170px 170px 170px;
          gap: 18px;
          margin-bottom: 18px;
        }

        .mainCard,
        .metricCard,
        .glassCard,
        .panel,
        .planCard {
          border: 1px solid rgba(255,255,255,.12);
          background: linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.055));
          box-shadow: 0 24px 80px rgba(0,0,0,.26);
          backdrop-filter: blur(18px);
        }

        .mainCard {
          border-radius: 32px;
          padding: 28px;
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .mainCard h2,
        .panel h2 {
          margin-bottom: 0;
          font-size: clamp(28px, 4vw, 48px);
          line-height: 1.02;
          letter-spacing: -0.05em;
        }

        .mainText {
          max-width: 820px;
          margin-top: 18px;
          color: rgba(255,255,255,.72);
          line-height: 1.65;
        }

        .scoreCircle {
          width: 116px;
          height: 116px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 999px;
          box-shadow: inset 0 0 32px rgba(0,0,0,.4);
        }

        .scoreCircle span {
          display: grid;
          place-items: center;
          width: 82px;
          height: 82px;
          border-radius: 999px;
          background: #0a0620;
          font-size: 24px;
          font-weight: 950;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .chips span,
        .areaPill {
          border: 1px solid rgba(104,244,255,.24);
          border-radius: 999px;
          padding: 9px 12px;
          color: rgba(255,255,255,.82);
          background: rgba(0,231,255,.08);
          font-size: 13px;
          font-weight: 850;
        }

        .metricCard {
          border-radius: 26px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 190px;
        }

        .metricCard span {
          color: rgba(255,255,255,.78);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .metricCard strong {
          font-size: 52px;
          line-height: 1;
        }

        .metricCard small {
          color: rgba(255,255,255,.62);
          line-height: 1.35;
        }

        .metricCard.critical,
        .planCard.critical {
          border-color: rgba(248, 113, 113, .38);
        }

        .metricCard.warn,
        .planCard.warn {
          border-color: rgba(250, 204, 21, .38);
        }

        .metricCard.ok,
        .planCard.ok {
          border-color: rgba(34, 197, 94, .38);
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 18px;
        }

        .glassCard {
          border-radius: 26px;
          padding: 22px;
        }

        .glassCard h3 {
          margin-bottom: 8px;
          color: #00e7ff;
          font-size: 34px;
          letter-spacing: -0.04em;
        }

        .glassCard p:not(.eyebrow) {
          color: rgba(255,255,255,.66);
          line-height: 1.45;
        }

        .panel {
          border-radius: 32px;
          padding: 26px;
          margin-bottom: 18px;
        }

        .panelHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .plansGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .planCard {
          border-radius: 28px;
          padding: 22px;
        }

        .planTop {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .planTop h3 {
          margin: 14px 0 8px;
          font-size: 34px;
          letter-spacing: -0.05em;
        }

        .planTop p {
          color: rgba(255,255,255,.64);
          line-height: 1.5;
        }

        .statusPill {
          height: fit-content;
          border-radius: 999px;
          padding: 9px 12px;
          color: #06111f;
          background: #fff;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .planCard.ok .statusPill {
          background: #86efac;
        }

        .planCard.warn .statusPill {
          background: #fde68a;
        }

        .planCard.critical .statusPill {
          background: #fca5a5;
        }

        .priceLine {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 18px;
        }

        .priceLine strong {
          color: #00e7ff;
          font-size: 44px;
          letter-spacing: -0.06em;
          line-height: .9;
        }

        .priceLine span {
          color: rgba(255,255,255,.62);
          font-size: 18px;
          font-weight: 850;
        }

        .planFacts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .planFacts div,
        .matchedBox,
        .missingBox {
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 18px;
          padding: 14px;
          background: rgba(0,0,0,.16);
        }

        .planFacts span,
        .matchedBox span {
          display: block;
          margin-bottom: 6px;
          color: rgba(255,255,255,.52);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .planFacts strong {
          font-size: 14px;
        }

        .matchedBox {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 12px;
          margin-bottom: 16px;
        }

        code {
          color: #67e8f9;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .missingBox h4 {
          margin-bottom: 10px;
          color: #fff;
        }

        .missingBox p {
          margin-bottom: 8px;
          color: rgba(255,255,255,.72);
          line-height: 1.45;
        }

        .missingBox .done {
          color: #86efac;
          font-weight: 850;
        }

        .areaBlock {
          margin-top: 24px;
        }

        .areaBlock h3 {
          margin-bottom: 12px;
          color: rgba(255,255,255,.9);
          font-size: 22px;
        }

        .checkList {
          display: grid;
          gap: 12px;
        }

        .checkRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: center;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 22px;
          padding: 18px;
          background: rgba(0,0,0,.18);
        }

        .checkRow strong {
          display: block;
          margin-bottom: 6px;
          font-size: 16px;
        }

        .checkRow p {
          margin-bottom: 0;
          color: rgba(255,255,255,.66);
          line-height: 1.5;
        }

        .checkRow small {
          display: block;
          margin-top: 8px;
          color: rgba(255,255,255,.48);
          line-height: 1.45;
        }

        .checkRow > span {
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .checkRow.ok > span {
          color: #052e16;
          background: #86efac;
        }

        .checkRow.warn > span {
          color: #422006;
          background: #fde68a;
        }

        .checkRow.critical > span {
          color: #450a0a;
          background: #fca5a5;
        }

        .empty {
          color: rgba(255,255,255,.58);
          line-height: 1.6;
        }

        @media (max-width: 1100px) {
          .diagnosticGrid,
          .summaryGrid,
          .plansGrid {
            grid-template-columns: 1fr;
          }

          .planFacts {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero,
          .cardTop,
          .planTop {
            flex-direction: column;
            align-items: flex-start;
          }

          .page {
            padding: 22px;
          }

          .refreshButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
