import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function pick(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function safeUrl(input: string) {
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const url = safeUrl(req.nextUrl.searchParams.get("url") || "");

  if (!url) {
    return json({ ok: false, error: "URL inválida." }, 400);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 SualumaPreviewBot/1.0",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timer);

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return json({
        ok: true,
        url,
        title: url,
        description: "",
        image: "",
        siteName: new URL(url).hostname,
      });
    }

    const html = (await response.text()).slice(0, 300000);

    const title = pick(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);

    const description = pick(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const image = pick(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const siteName = pick(html, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    ]) || new URL(url).hostname;

    return json({
      ok: true,
      url,
      title: title || url,
      description,
      image,
      siteName,
    });
  } catch (error: any) {
    return json({
      ok: true,
      url,
      title: url,
      description: "",
      image: "",
      siteName: new URL(url).hostname,
      fallback: true,
    });
  }
}
