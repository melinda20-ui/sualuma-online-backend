import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tenantIdFromUserId } from "@/lib/tenant/tenant-store";

type SualumaUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export async function getFlowmindTenant() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Você precisa estar logado para acessar seu FlowMind." },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true as const,
    user: user as SualumaUser,
    tenantId: tenantIdFromUserId(user.id),
  };
}
