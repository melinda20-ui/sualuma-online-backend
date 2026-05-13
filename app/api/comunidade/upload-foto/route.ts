import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "trabalhosja", "uploads", "profiles");

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ ok: false, error: "Faça login." }, 401);
  }

  const form = await req.formData().catch(() => null);
  if (!form) return json({ ok: false, error: "FormData esperado." }, 400);

  const file = form.get("foto") as File | null;
  if (!file) return json({ ok: false, error: "Envie uma imagem." }, 400);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
  if (!allowed.includes(ext)) {
    return json({ ok: false, error: "Formato não permitido. Use jpg, png, gif ou webp." }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const maxSize = 5 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return json({ ok: false, error: "Imagem muito grande. Máximo 5MB." }, 400);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const email = (user.email || "").toLowerCase().trim();
  const safeName = email.replace(/[@.]/g, "_");
  const filename = safeName + "." + ext;
  const filepath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filepath, buffer);

  const photoUrl = "/uploads/profiles/" + filename;

  // Save to local profile
  const profilesDir = path.join(process.cwd(), "data", "community-profiles");
  await fs.mkdir(profilesDir, { recursive: true });
  const profileFile = path.join(profilesDir, safeName + ".json");
  let profileData: any = {};
  try {
    profileData = JSON.parse(await fs.readFile(profileFile, "utf8"));
  } catch {}
  profileData.photoUrl = photoUrl;
  profileData.updatedAt = new Date().toISOString();
  await fs.writeFile(profileFile, JSON.stringify(profileData, null, 2), "utf8");

  return json({ ok: true, photoUrl });
}
