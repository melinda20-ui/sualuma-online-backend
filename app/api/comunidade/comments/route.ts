import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase, corsHeaders, json, requireUser, userName } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserFromCookie() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  let user: any = null;

  // Try cookie-based auth first (used by the static frontend)
  user = await getUserFromCookie();

  // Fallback to Bearer token
  if (!user) {
    const result = await requireUser(request);
    user = result.user;
  }

  if (!user) {
    return json({ ok: false, error: "Faça login para comentar." }, 401);
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

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");

  if (!postId) {
    return json({ ok: false, error: "postId é obrigatório." }, 400);
  }

  const supabase = adminSupabase();

  const { data, error } = await supabase
    .from("community_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, comments: data || [] });
}
