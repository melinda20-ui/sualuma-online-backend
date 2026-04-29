import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Tone = "pink" | "blue" | "green" | "yellow" | "red" | "purple";

const validTones = new Set(["pink", "blue", "green", "yellow", "red", "purple"]);

function safeTone(value: unknown, fallback: Tone = "blue"): Tone {
  return typeof value === "string" && validTones.has(value) ? (value as Tone) : fallback;
}

const fallback = {
  systemTaskRows: [
    { title: "Corrigir páginas de entrada", detail: "Home, blog, planos e páginas de captura precisam estar sem erro para receber leads.", value: "em risco", tone: "red", tag: "Sistema" },
    { title: "Ativar rastreio por subdomínio", detail: "Monitorar tráfego e origem dos leads por área do ecossistema.", value: "em andamento", tone: "yellow", tag: "Marketing" },
  ],
  storeProductRows: [
    { title: "Agente Propostas Comerciais", detail: "Categoria: Agentes • Status: publicado • Conversão alta", value: "ativo", tone: "green" },
    { title: "Automação Follow-up WhatsApp", detail: "Categoria: Automações • Falta revisar descrição e gatilho", value: "revisar", tone: "yellow" },
  ],
  communityModerationRows: [
    { title: "Denúncia contra @marcos.dev", detail: "Motivo: autopromoção repetida em comentários. Denunciado por @ana.paula.", value: "enviar aviso", tone: "yellow" },
  ],
  cnpjNotificationRows: [
    { title: "Declaração mensal", detail: "Verificar se há pendência ou obrigação recorrente do mês.", value: "atenção", tone: "yellow" },
  ],
  subdomainRows: [
    { name: "sualuma.online", status: "Online", tone: "green", links: ["/", "/planos", "/login"] },
    { name: "studio.sualuma.online", status: "Ativo", tone: "pink", links: ["/studio-lab", "/studio", "/admin"] },
  ],
};

function normalizeRows(rows: any[] | null | undefined, fallbackRows: any[]) {
  if (!rows || rows.length === 0) return fallbackRows;

  return rows.map((row) => ({
    ...row,
    tone: safeTone(row.tone),
  }));
}

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      tasksResult,
      productsResult,
      reportsResult,
      cnpjResult,
      subdomainsResult,
      linksResult,
    ] = await Promise.all([
      supabase.from("studio_system_tasks").select("title,detail,value,tone,tag,priority").order("priority", { ascending: true }),
      supabase.from("studio_store_products").select("title,detail,value,tone,category,status,priority").order("priority", { ascending: true }),
      supabase.from("studio_community_reports").select("title,detail,value,tone,reported_user,reporter_user,reason,status,created_at").order("created_at", { ascending: false }),
      supabase.from("studio_cnpj_notifications").select("title,detail,value,tone,status,due_date,created_at").order("created_at", { ascending: false }),
      supabase.from("studio_subdomains").select("subdomain_key,name,status,tone").order("created_at", { ascending: true }),
      supabase.from("studio_subdomain_links").select("subdomain_key,path,status").order("path", { ascending: true }),
    ]);

    const errors = [
      tasksResult.error,
      productsResult.error,
      reportsResult.error,
      cnpjResult.error,
      subdomainsResult.error,
      linksResult.error,
    ].filter(Boolean).map((error) => error?.message);

    const linksBySubdomain = new Map<string, string[]>();

    for (const link of linksResult.data || []) {
      const current = linksBySubdomain.get(link.subdomain_key) || [];
      current.push(link.path);
      linksBySubdomain.set(link.subdomain_key, current);
    }

    const subdomainRows = subdomainsResult.data?.length
      ? subdomainsResult.data.map((item) => ({
          name: item.name,
          status: item.status,
          tone: safeTone(item.tone),
          links: linksBySubdomain.get(item.subdomain_key) || [],
        }))
      : fallback.subdomainRows;

    return NextResponse.json({
      ok: errors.length === 0,
      source: errors.length === 0 ? "supabase" : "mixed",
      errors,
      data: {
        systemTaskRows: normalizeRows(tasksResult.data, fallback.systemTaskRows),
        storeProductRows: normalizeRows(productsResult.data, fallback.storeProductRows),
        communityModerationRows: normalizeRows(reportsResult.data, fallback.communityModerationRows),
        cnpjNotificationRows: normalizeRows(cnpjResult.data, fallback.cnpjNotificationRows),
        subdomainRows,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      source: "fallback",
      error: error instanceof Error ? error.message : String(error),
      data: fallback,
    });
  }
}
