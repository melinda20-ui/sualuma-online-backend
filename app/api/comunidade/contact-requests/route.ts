import { NextResponse } from "next/server";
import { adminSupabase, corsHeaders, json, requireUser, userName } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const { user, error: authError } = await requireUser(request);

  if (!user) {
    return json({ ok: false, error: authError }, 401);
  }

  const body = await request.json().catch(() => ({}));

  if (!body.targetProfileId || !body.targetName) {
    return json({ ok: false, error: "Pessoa de destino obrigatória." }, 400);
  }

  const supabase = adminSupabase();

  const { data, error } = await supabase
    .from("community_contact_requests")
    .insert({
      requester_user_id: user.id,
      requester_name: userName(user),
      target_profile_id: body.targetProfileId,
      target_name: body.targetName,
      message: body.message || "",
      status: "pendente",
      tag: "amigo",
    })
    .select("*")
    .single();

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, request: data });
}
