import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageItem = {
  route: string;
  title: string;
  area: string;
  source: string;
  url: string;
  file: string;
  updatedAt: string;
  updatedAtFormatted: string;
  status: string;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function todayKey() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(new Date());
}

function dateKey(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(value);
}

function titleFromRoute(route: string) {
  if (route === "/") return "Home principal";

  const last = route.split("/").filter(Boolean).pop() || route;

  return last
    .replace(/\[|\]/g, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function areaFromRoute(route: string) {
  if (route === "/") return "Principal";
  if (route.startsWith("/studio") || route === "/studio-lab") return "Studio";
  if (route.startsWith("/admin")) return "Admin";
  if (route.startsWith("/cliente") || route === "/indique") return "Cliente";
  if (route.startsWith("/prestador") || route.startsWith("/provider")) return "Prestador";
  if (route.startsWith("/member")) return "Área de membros";
  if (route.startsWith("/auth") || route.includes("sign-in") || route.includes("sign-up") || route.includes("login") || route.includes("entrar")) return "Autenticação";
  if (route.startsWith("/api")) return "API";
  return "Página pública";
}

function baseUrlForRoute(route: string) {
  if (route.startsWith("/studio") || route === "/studio-lab") {
    return "https://studio.sualuma.online";
  }

  if (route === "/indique" || route.startsWith("/cliente")) {
    return "https://dashboardcliente.sualuma.online";
  }

  return "https://sualuma.online";
}

function routeFromPageFile(appDir: string, filePath: string) {
  let relative = path.relative(appDir, filePath);

  relative = relative.replace(/\\/g, "/");
  relative = relative.replace(/\/page\.(tsx|ts|jsx|js)$/, "");

  const parts = relative
    .split("/")
    .filter(Boolean)
    .filter((part) => !part.startsWith("(") && !part.endsWith(")"));

  const route = "/" + parts.join("/");

  return route === "/" ? "/" : route.replace(/\/+/g, "/");
}

function walkPages(dir: string, appDir: string, items: PageItem[]) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "api" ||
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name.startsWith("_")
      ) {
        continue;
      }

      walkPages(full, appDir, items);
      continue;
    }

    if (!/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;

    const stat = fs.statSync(full);
    const updatedAt = stat.mtime;
    const route = routeFromPageFile(appDir, full);
    const baseUrl = baseUrlForRoute(route);
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    items.push({
      route,
      title: titleFromRoute(route),
      area: areaFromRoute(route),
      source: "Next App Router",
      url: `${cleanBase}${route === "/" ? "" : route}`,
      file: path.relative(process.cwd(), full),
      updatedAt: updatedAt.toISOString(),
      updatedAtFormatted: formatDate(updatedAt),
      status: "Encontrada no projeto",
    });
  }
}

function scanStaticSites(items: PageItem[]) {
  const staticDir = "/var/www/static-sites";

  if (!fs.existsSync(staticDir)) return;

  const entries = fs.readdirSync(staticDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folder = path.join(staticDir, entry.name);
    const indexFile = path.join(folder, "index.html");

    if (!fs.existsSync(indexFile)) continue;

    const stat = fs.statSync(indexFile);
    const updatedAt = stat.mtime;

    items.push({
      route: "/",
      title: entry.name,
      area: "Site estático VPS",
      source: "Static Sites",
      url: `https://${entry.name}.sualuma.online`,
      file: indexFile,
      updatedAt: updatedAt.toISOString(),
      updatedAtFormatted: formatDate(updatedAt),
      status: "Encontrada em /var/www/static-sites",
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
    const limit = Number(request.nextUrl.searchParams.get("limit") || "80");

    const appDir = path.join(process.cwd(), "app");
    const items: PageItem[] = [];

    walkPages(appDir, appDir, items);
    scanStaticSites(items);

    const sorted = items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const filtered = search
      ? sorted.filter((item) => {
          const text = `${item.title} ${item.route} ${item.area} ${item.url} ${item.file}`.toLowerCase();
          return text.includes(search);
        })
      : sorted;

    const hoje = todayKey();

    const hojeItems = sorted.filter((item) => dateKey(new Date(item.updatedAt)) === hoje);

    return NextResponse.json({
      ok: true,
      source: "filesystem",
      today: hoje,
      summary: {
        totalPages: sorted.length,
        totalHoje: hojeItems.length,
        nextPages: sorted.filter((item) => item.source === "Next App Router").length,
        staticSites: sorted.filter((item) => item.source === "Static Sites").length,
      },
      ultimasHoje: hojeItems.slice(0, 5),
      pages: filtered.slice(0, Number.isFinite(limit) ? limit : 80),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao montar catálogo de páginas.",
      },
      { status: 500 }
    );
  }
}
