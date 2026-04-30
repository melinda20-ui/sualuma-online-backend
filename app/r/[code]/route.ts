import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Variáveis Supabase não encontradas.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function withRef(destinationUrl: string, code: string) {
  try {
    const url = new URL(destinationUrl);
    url.searchParams.set("ref", code);
    return url.toString();
  } catch {
    const separator = destinationUrl.includes("?") ? "&" : "?";
    return `${destinationUrl}${separator}ref=${encodeURIComponent(code)}`;
  }
}

function getVisitorId(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";

  return `${ip}-${userAgent}`.slice(0, 500);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const fallbackUrl = "https://sualuma.online/cadastro";

  try {
    const { code } = await context.params;
    const cleanCode = String(code || "").trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = getSupabaseAdmin();

    const { data: link, error } = await supabase
      .from("referral_links")
      .select("*")
      .eq("code", cleanCode)
      .eq("active", true)
      .maybeSingle();

    if (error || !link) {
      return NextResponse.redirect(fallbackUrl);
    }

    const destinationUrl = withRef(link.destination_url || fallbackUrl, cleanCode);

    await supabase
      .from("referral_links")
      .update({
        clicks_count: (link.clicks_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    await supabase.from("referral_events").insert({
      referral_link_id: link.id,
      code: cleanCode,
      event_type: "click",
      visitor_id: getVisitorId(req),
      metadata: {
        source: "r-route",
        destination_url: destinationUrl,
        user_agent: req.headers.get("user-agent"),
        referrer: req.headers.get("referer"),
      },
    });

    return NextResponse.redirect(destinationUrl);
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }
}
