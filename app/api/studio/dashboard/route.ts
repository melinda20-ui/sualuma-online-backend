import { NextResponse } from "next/server";
import { getStudioDashboardData } from "@/lib/studio/studio-dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_API_BASE = process.env.AGENT_API_URL || "http://localhost:3001";

async function fetchAgentStatus() {
  try {
    const res = await fetch(`${AGENT_API_BASE}/api/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAgentMeta() {
  try {
    const res = await fetch(`${AGENT_API_BASE}/api/agents/meta`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchOperationsHistory(limit = 30) {
  try {
    const res = await fetch(`${AGENT_API_BASE}/api/operations/history?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAlerts() {
  try {
    const res = await fetch(`${AGENT_API_BASE}/api/alerts/check`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.alerts || [];
  } catch {
    return null;
  }
}

async function fetchKanbanStats() {
  try {
    const res = await fetch(`${AGENT_API_BASE}/api/operations/kanban-stats`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const [studioData, agentStatus, agentMeta, history, alerts, kanban] = await Promise.all([
    getStudioDashboardData(),
    fetchAgentStatus(),
    fetchAgentMeta(),
    fetchOperationsHistory(30),
    fetchAlerts(),
    fetchKanbanStats(),
  ]);

  const merged = {
    ...studioData,
    agentData: {
      status: agentStatus,
      agents: agentMeta,
      history: history || [],
      alerts: alerts || [],
      kanban: kanban || null,
    },
    source: studioData.source === "database" ? "postgres" : "fallback",
  };

  return NextResponse.json(merged, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

