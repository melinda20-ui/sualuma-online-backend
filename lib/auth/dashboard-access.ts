import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

export type DashboardAccess = {
  authenticated: boolean;
  email: string | null;
  isAdmin: boolean;
  hasIa: boolean;
  hasProvider: boolean;
  isCommonClient: boolean;
  target:
    | "login"
    | "admin"
    | "client_services"
    | "client_ia"
    | "provider"
    | "choice";
};

function normalize(value: unknown) {
  try {
    return JSON.stringify(value || {}).toLowerCase();
  } catch {
    return "";
  }
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

export async function getDashboardAccess(): Promise<DashboardAccess> {
  let user: any = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (error) {
    console.warn("[dashboard-access] Falha segura ao ler usuário:", error);
    user = null;
  }

  const email = String(user?.email || "").toLowerCase();

  if (!email) {
    return {
      authenticated: false,
      email: null,
      isAdmin: false,
      hasIa: false,
      hasProvider: false,
      isCommonClient: false,
      target: "login",
    };
  }

  const isAdmin = ADMIN_EMAILS.has(email);

  const metadataText = normalize({
    email,
    user_metadata: user?.user_metadata,
    app_metadata: user?.app_metadata,
  });

  const hasIa = hasAny(metadataText, [
    "ia_client",
    "ai_client",
    "cliente_ia",
    "cliente ia",
    "plano_ia",
    "ia_plan",
    "ai_plan",
    "member-user",
    "premium",
    "pro",
    "básico",
    "basico"
  ]);

  const hasProvider = hasAny(metadataText, [
    "service_provider",
    "provider_plan",
    "provider",
    "prestador",
    "prestador_servico",
    "prestador de serviço",
    "pacote-propostas",
    "prioritario",
    "prioritário",
    "agencia-time",
    "agência-time",
    "provider-services"
  ]);

  let target: DashboardAccess["target"] = "client_services";

  if (isAdmin) target = "admin";
  else if (hasIa && hasProvider) target = "choice";
  else if (hasIa) target = "client_ia";
  else if (hasProvider) target = "provider";
  else target = "client_services";

  return {
    authenticated: true,
    email,
    isAdmin,
    hasIa,
    hasProvider,
    isCommonClient: !hasIa && !hasProvider,
    target,
  };
}

export function getDashboardUrl(target: DashboardAccess["target"]) {
  const studioUrl = process.env.SUALUMA_STUDIO_URL || "https://studio.sualuma.online";
  const clientUrl = process.env.SUALUMA_CLIENT_DASHBOARD_URL || "https://dashboardcliente.sualuma.online";
  const providerUrl = process.env.SUALUMA_PROVIDER_DASHBOARD_URL || "https://meuservico.sualuma.online";

  if (target === "admin") return studioUrl;
  if (target === "client_ia") return `${clientUrl}/member-user`;
  if (target === "client_services") return `${clientUrl}/member-services`;
  if (target === "provider") return `${providerUrl}/provider-services`;
  if (target === "choice") return "/portal";

  return "/login";
}
