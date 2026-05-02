import fs from "fs";
import path from "path";

type StudioCard = {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  status: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
};

type StudioTask = {
  id: string;
  title: string;
  area: string;
  priority: string;
  status: string;
  lane_id: string;
  plain_explanation: string;
  source: string;
  metadata?: Record<string, unknown>;
};

type StudioEvent = {
  id: string;
  title: string;
  description: string;
  type: string;
  source: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

type DashboardData = {
  ok: boolean;
  source: "database" | "fallback";
  message: string;
  cards: StudioCard[];
  tasks: StudioTask[];
  events: StudioEvent[];
  generatedAt: string;
};

function readFallback(): Omit<DashboardData, "ok" | "source" | "message" | "generatedAt"> {
  const file = path.join(process.cwd(), "data", "studio-dashboard-fallback.json");

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {
      cards: [],
      tasks: [],
      events: [],
    };
  }
}

function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return { url, key };
}

async function supabaseSelect<T>(table: string, order?: string): Promise<T[]> {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    throw new Error("Supabase não configurado nas variáveis de ambiente.");
  }

  const query = order ? `?select=*&order=${order}` : "?select=*";
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}${query}`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Erro ao ler ${table}: ${res.status} ${body}`);
  }

  return (await res.json()) as T[];
}

export async function getStudioDashboardData(): Promise<DashboardData> {
  const generatedAt = new Date().toISOString();

  try {
    const [cardsRaw, tasksRaw, eventsRaw] = await Promise.all([
      supabaseSelect<StudioCard>("studio_dashboard_cards", "sort_order.asc"),
      supabaseSelect<StudioTask>("studio_tasks", "updated_at.desc"),
      supabaseSelect<StudioEvent>("studio_events", "created_at.desc"),
    ]);

    const cards = cardsRaw.filter((card: any) => card.is_active !== false);

    return {
      ok: true,
      source: "database",
      message: "Studio Luma conectado ao banco de dados.",
      cards,
      tasks: tasksRaw,
      events: eventsRaw.slice(0, 20),
      generatedAt,
    };
  } catch (error) {
    console.error("[Studio Luma] Usando fallback local.", error);

    const fallback = readFallback();

    return {
      ok: true,
      source: "fallback",
      message: error instanceof Error ? error.message : "Banco indisponível. Usando fallback local.",
      ...fallback,
      generatedAt,
    };
  }
}
