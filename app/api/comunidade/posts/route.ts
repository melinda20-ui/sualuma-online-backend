import { NextResponse } from "next/server";
import { adminSupabase, corsHeaders, json, requireUser, userAvatar, userName } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const supabase = adminSupabase();

  const { data: posts, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return json({ ok: false, error: error.message, posts: [] }, 500);
  }

  const ids = (posts || []).map((p: any) => p.id);

  let comments: any[] = [];
  let shares: any[] = [];

  if (ids.length) {
    const commentsRes = await supabase
      .from("community_comments")
      .select("*")
      .in("post_id", ids)
      .order("created_at", { ascending: true });

    comments = commentsRes.data || [];

    const sharesRes = await supabase
      .from("community_shares")
      .select("*")
      .in("post_id", ids)
      .order("created_at", { ascending: true });

    shares = sharesRes.data || [];
  }

  const enriched = (posts || []).map((post: any) => {
    const postComments = comments.filter((c: any) => c.post_id === post.id);
    const postShares = shares.filter((s: any) => s.post_id === post.id);

    return {
      ...post,
      comments: postComments,
      shares: postShares,
      commentsCount: postComments.length,
      sharesCount: postShares.length,
      commentedBy: [...new Set(postComments.map((c: any) => c.author_name))].slice(0, 5),
      sharedBy: [...new Set(postShares.map((s: any) => s.author_name))].slice(0, 5),
    };
  });

  return json({ ok: true, posts: enriched });
}

export async function POST(request: Request) {
  const { user, error: authError } = await requireUser(request);

  if (!user) {
    return json({ ok: false, error: authError }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const supabase = adminSupabase();

  const payload = {
    author_user_id: user.id,
    author_name: userName(user),
    author_avatar_url: userAvatar(user),
    category: body.category || "Geral",
    title: body.title || "Publicação",
    body: body.body || body.text || "",
    image_url: body.imageUrl || body.image_url || "",
    link_url: body.linkUrl || body.link_url || "",
    video_url: body.videoUrl || body.video_url || "",
    source: body.source || "manual",
    source_external_id: body.sourceExternalId || body.source_external_id || "",
    updated_at: new Date().toISOString(),
  };

  if (!payload.title || !payload.body) {
    return json({ ok: false, error: "Título e texto são obrigatórios." }, 400);
  }

  if (payload.source_external_id) {
    const { data: existing } = await supabase
      .from("community_posts")
      .select("id")
      .eq("source", payload.source)
      .eq("source_external_id", payload.source_external_id)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("community_posts")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, mode: "updated", post: data });
    }
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, mode: "created", post: data });
}
