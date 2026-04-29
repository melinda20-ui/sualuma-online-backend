import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return NextResponse.json({
    authenticated: !!user,
    id: user?.id ?? null,
    email: user?.email ?? null,
    error: error?.message ?? null,
  });
}
