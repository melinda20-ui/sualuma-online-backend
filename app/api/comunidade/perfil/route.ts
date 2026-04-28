import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return json({ ok: true });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createSupabaseAdmin(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function readJsonFile(filePath: string, fallback: any) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeDashboard(row: any) {
  if (!row) return null;

  return (
    row.dashboard ||
    row.dashboard_json ||
    row.data ||
    row.payload ||
    row.profile_data ||
    row.provider_data ||
    row
  );
}

async function getProviderDashboardFromSupabase(userId: string, email?: string | null) {
  const admin = getAdminClient();
  if (!admin) return null;

  const tables = [
    "provider_dashboards",
    "prestador_dashboards",
    "provider_profiles",
    "prestador_profiles",
    "profiles",
  ];

  const idColumns = ["user_id", "userId", "owner_id", "supabase_user_id", "id"];
  const emailColumns = ["email", "user_email"];

  for (const table of tables) {
    for (const col of idColumns) {
      try {
        const { data, error } = await admin
          .from(table)
          .select("*")
          .eq(col, userId)
          .maybeSingle();

        if (!error && data) return normalizeDashboard(data);
      } catch {}
    }

    if (email) {
      for (const col of emailColumns) {
        try {
          const { data, error } = await admin
            .from(table)
            .select("*")
            .eq(col, email)
            .maybeSingle();

          if (!error && data) return normalizeDashboard(data);
        } catch {}
      }
    }
  }

  return null;
}

async function getProviderDashboardFallback() {
  const file = path.join(process.cwd(), "data", "provider-dashboard.json");
  return await readJsonFile(file, {});
}

async function getCommunityPostsFromSupabase(userId: string, email?: string | null) {
  const admin = getAdminClient();
  if (!admin) return [];

  const tables = [
    "community_posts",
    "comunidade_posts",
    "trabalhosja_posts",
    "posts_comunidade",
  ];

  const idColumns = ["author_user_id", "user_id", "userId", "authorId", "owner_id"];
  const emailColumns = ["author_email", "email", "user_email"];

  for (const table of tables) {
    for (const col of idColumns) {
      try {
        const { data, error } = await admin
          .from(table)
          .select("*")
          .eq(col, userId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length) return data;
      } catch {}
    }

    if (email) {
      for (const col of emailColumns) {
        try {
          const { data, error } = await admin
            .from(table)
            .select("*")
            .eq(col, email)
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data) && data.length) return data;
        } catch {}
      }
    }
  }

  return [];
}

async function getCommunityPostsFallback(userId: string, email?: string | null) {
  const possibleFiles = [
    path.join(process.cwd(), "data", "community-posts.json"),
    path.join(process.cwd(), "data", "comunidade-posts.json"),
    path.join(process.cwd(), "data", "trabalhosja-posts.json"),
  ];

  for (const file of possibleFiles) {
    const data = await readJsonFile(file, null);

    const posts = Array.isArray(data)
      ? data
      : Array.isArray(data?.posts)
        ? data.posts
        : [];

    if (posts.length) {
      return posts.filter((post: any) => {
        return (
          post.author_user_id === userId ||
          post.user_id === userId ||
          post.userId === userId ||
          post.authorId === userId ||
          post.owner_id === userId ||
          post.author_email === email ||
          post.email === email ||
          post.user_email === email
        );
      });
    }
  }

  return [];
}

function getProviderProfile(dashboard: any, user: any) {
  const meta = user?.user_metadata || {};

  return (
    dashboard?.providerProfile ||
    dashboard?.profile ||
    dashboard?.portfolioProfile ||
    dashboard?.data?.providerProfile ||
    {
      name:
        meta.full_name ||
        meta.name ||
        meta.nome ||
        user?.email?.split("@")?.[0] ||
        "Prestador Sualuma",
      title: "Prestador da comunidade Sualuma",
      email: user?.email || "",
      bio: "",
      photoUrl:
        meta.avatar_url ||
        meta.picture ||
        meta.photo_url ||
        meta.foto_url ||
        meta.profile_photo_url ||
        "",
    }
  );
}

function getPortfolio(dashboard: any) {
  const portfolio =
    dashboard?.portfolio ||
    dashboard?.works ||
    dashboard?.trabalhos ||
    dashboard?.data?.portfolio ||
    dashboard?.data?.works ||
    [];

  return Array.isArray(portfolio) ? portfolio : [];
}

function getPhoto(providerProfile: any) {
  return (
    providerProfile?.photoUrl ||
    providerProfile?.fotoUrl ||
    providerProfile?.profilePhotoUrl ||
    providerProfile?.profile_photo_url ||
    providerProfile?.avatarUrl ||
    providerProfile?.avatar_url ||
    providerProfile?.imageUrl ||
    providerProfile?.picture ||
    providerProfile?.photo ||
    providerProfile?.foto ||
    ""
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return json(
      {
        ok: false,
        error: "Usuário não autenticado.",
      },
      401
    );
  }

  const email = user.email || "";

  const dashboardFromSupabase = await getProviderDashboardFromSupabase(user.id, email);
  const dashboardFallback = await getProviderDashboardFallback();
  const dashboard = dashboardFromSupabase || dashboardFallback || {};

  const providerProfile = getProviderProfile(dashboard, user);
  const portfolio = getPortfolio(dashboard);

  const postsFromSupabase = await getCommunityPostsFromSupabase(user.id, email);
  const postsFallback = await getCommunityPostsFallback(user.id, email);
  const posts = postsFromSupabase.length ? postsFromSupabase : postsFallback;

  return json({
    ok: true,
    user: {
      id: user.id,
      email,
      name:
        providerProfile?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0],
    },
    providerProfile: {
      ...providerProfile,
      email: providerProfile?.email || email,
      photoUrl: getPhoto(providerProfile),
    },
    portfolio,
    posts,
    stats: {
      posts: posts.length,
      portfolio: portfolio.length,
      comments: posts.reduce(
        (sum: number, post: any) =>
          sum + Number(post.commentsCount || post.comments_count || 0),
        0
      ),
      shares: posts.reduce(
        (sum: number, post: any) =>
          sum + Number(post.sharesCount || post.shares_count || 0),
        0
      ),
    },
    source: dashboardFromSupabase ? "supabase" : "provider-dashboard-json",
  });
}
