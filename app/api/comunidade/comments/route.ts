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

  if (!body.postId || !body.body) {
    return json({ ok: false, error: "Post e comentário são obrigatórios." }, 400);
  }

  const supabase = adminSupabase();

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: body.postId,
      author_user_id: user.id,
      author_name: userName(user),
      body: body.body,
    })
    .select("*")
    .single();

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, comment: data });
}
