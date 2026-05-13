"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  videoUrl: string;
  category: string;
  authorName: string;
  createdAt: string;
}

interface Profile {
  name: string;
  photoUrl: string;
  bio: string;
  customLink: string;
  email: string;
}

interface PortfolioItem {
  title?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  url?: string;
}

function esc(v: any) {
  return String(v || "").replace(/[&<>"']/g, (m: string) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m] || m
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

function timeLabel(date: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProfileClient({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const email = atob(slug);
        if (!email || !email.includes("@")) {
          setError("Perfil não encontrado.");
          setLoading(false);
          return;
        }

        const [profileRes, postsRes] = await Promise.all([
          fetch("/api/comunidade/perfil-publico?email=" + encodeURIComponent(email), { cache: "no-store" }),
          fetch("/api/comunidade/posts?authorEmail=" + encodeURIComponent(email) + "&t=" + Date.now(), { cache: "no-store" }),
        ]);

        const profileJson = await profileRes.json();
        const postsJson = await postsRes.json();

        if (!profileJson.ok) {
          setError("Perfil não encontrado.");
          setLoading(false);
          return;
        }

        setProfile(profileJson.profile);
        setPortfolio(profileJson.portfolio || []);
        setPosts(postsJson.posts || postsJson.data || []);
      } catch {
        setError("Erro ao carregar perfil.");
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#050714", color: "#fff", display: "grid", placeItems: "center", fontFamily: "Inter, Arial, sans-serif" }}>
        <p style={{ color: "#cfd5ff" }}>Carregando perfil...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main style={{ minHeight: "100vh", background: "#050714", color: "#fff", display: "grid", placeItems: "center", fontFamily: "Inter, Arial, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 32, margin: "0 0 8px" }}>Perfil não encontrado</h1>
          <p style={{ color: "#cfd5ff", margin: "0 0 20px" }}>{error || "Este perfil não existe ou foi removido."}</p>
          <Link href="https://trabalhosja.sualuma.online" style={{ color: "#18f2ff" }}>← Voltar para comunidade</Link>
        </div>
      </main>
    );
  }

  const hasPosts = posts.length > 0;
  const hasPortfolio = portfolio.length > 0;

  return (
    <main style={{ minHeight: "100vh", background: "#050714", color: "#fff", fontFamily: "Inter, Arial, sans-serif" }}>
      <div style={{ maxWidth: 935, margin: "0 auto", padding: "30px 16px 60px" }}>
        {/* Profile header */}
        <div style={{ display: "flex", gap: 30, alignItems: "center", marginBottom: 44, flexWrap: "wrap" }}>
          <div style={{
            width: 150, height: 150, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto",
            background: "linear-gradient(135deg, #8d5cff, #18f2ff)",
            display: "grid", placeItems: "center", fontSize: 48, fontWeight: 1000, color: "#fff",
          }}>
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials(profile.name)
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 28, fontWeight: 1000, margin: "0 0 4px", lineHeight: 1.2 }}>{profile.name}</h1>
            {profile.bio && <p style={{ color: "#cfd5ff", margin: "0 0 6px", lineHeight: 1.5, fontSize: 15 }}>{profile.bio}</p>}
            {profile.customLink && (
              <a href={profile.customLink} target="_blank" rel="noopener"
                style={{ color: "#18f2ff", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
                🔗 {profile.customLink.replace(/^https?:\/\//, "")}
              </a>
            )}
            <div style={{ display: "flex", gap: 24, marginTop: 14, fontSize: 15 }}>
              <span><strong style={{ fontWeight: 1000 }}>{posts.length}</strong> <span style={{ color: "#9da7d9" }}>publicações</span></span>
              <span><strong style={{ fontWeight: 1000 }}>{portfolio.length}</strong> <span style={{ color: "#9da7d9" }}>trabalhos no portfólio</span></span>
            </div>
          </div>
        </div>

        {/* Portfolio grid */}
        {hasPortfolio && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 1000, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>💼</span> Portfólio
            </h2>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14,
            }}>
              {portfolio.map((item, i) => {
                const img = item.image || item.imageUrl;
                const link = item.link || item.url;
                return (
                  <a key={i} href={link || "#"} target="_blank" rel="noopener"
                    style={{
                      border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, overflow: "hidden",
                      background: "rgba(255,255,255,.055)", textDecoration: "none", color: "#fff",
                      transition: ".18s ease", display: "block",
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(24,242,255,.35)"; }}
                    onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = ""; }}
                  >
                    {img ? (
                      <div style={{ width: "100%", height: 180, overflow: "hidden" }}>
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{
                        width: "100%", height: 180, display: "grid", placeItems: "center",
                        background: "linear-gradient(135deg, rgba(141,92,255,.5), rgba(24,242,255,.4))",
                        fontSize: 40,
                      }}>🖼️</div>
                    )}
                    <div style={{ padding: 14 }}>
                      <strong style={{ display: "block", fontSize: 15, marginBottom: 4 }}>{item.title || "Trabalho"}</strong>
                      {item.description && <p style={{ margin: 0, fontSize: 13, color: "#cfd5ff", lineHeight: 1.4 }}>{item.description}</p>}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Posts feed */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 1000, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📝</span> Publicações
          </h2>
          {!hasPosts ? (
            <div style={{
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: 30, textAlign: "center",
              background: "rgba(255,255,255,.03)", color: "#9da7d9",
            }}>
              Nenhuma publicação ainda.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {posts.map((post) => (
                <article key={post.id} style={{
                  border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, padding: 18, overflow: "hidden",
                  background: "rgba(255,255,255,.055)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(24,242,255,.25)",
                      background: "rgba(24,242,255,.1)", color: "#aaf9ff", fontSize: 12, fontWeight: 1000,
                    }}>{post.category || "Geral"}</span>
                    <span style={{ color: "#9da7d9", fontSize: 13, fontWeight: 800 }}>{timeLabel(post.createdAt)}</span>
                  </div>
                  <h3 style={{ fontSize: 22, lineHeight: 1.15, margin: "0 0 8px", letterSpacing: "-.02em" }}>
                    {post.title}
                  </h3>
                  {(post.content || post.body) && (
                    <p style={{ color: "#cfd5ff", lineHeight: 1.55, fontSize: 15, margin: "0 0 10px" }}>
                      {(post.content || post.body).slice(0, 280)}{(post.content || post.body).length > 280 ? "..." : ""}
                    </p>
                  )}
                  {post.imageUrl && (
                    <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 10 }}>
                      <img src={post.imageUrl} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {post.linkUrl && (
                      <a href={post.linkUrl} target="_blank" rel="noopener"
                        style={{ padding: "8px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.07)", color: "#fff", fontWeight: 900, fontSize: 13, textDecoration: "none" }}>
                        🔗 Abrir link
                      </a>
                    )}
                    {post.videoUrl && (
                      <a href={post.videoUrl} target="_blank" rel="noopener"
                        style={{ padding: "8px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.07)", color: "#fff", fontWeight: 900, fontSize: 13, textDecoration: "none" }}>
                        ▶️ Ver vídeo
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <a href="https://trabalhosja.sualuma.online"
            style={{ color: "#18f2ff", fontWeight: 800, fontSize: 14 }}>
            ← Voltar para comunidade
          </a>
        </div>
      </div>
    </main>
  );
}
