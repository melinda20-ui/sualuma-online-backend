import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;

  const content = fs.readFileSync(file, "utf8");

  for (const line of content.split("\n")) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;

    const [key, ...rest] = clean.split("=");
    const value = rest.join("=").replace(/^["']|["']$/g, "");

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(".env");
loadEnv(".env.local");

const email = process.argv[2] || "lumabusiness1.0@gmail.com";
const next = process.argv[3] || "/studio/usuarios-diagnostico";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const serviceRole =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRole) {
  console.error("❌ Falta Supabase URL ou SERVICE ROLE KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const redirectTo = `https://sualuma.online/auth/callback?next=${encodeURIComponent(next)}`;

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: {
    redirectTo,
  },
});

if (error) {
  console.error("❌ Erro ao gerar link mágico:", error.message);
  process.exit(1);
}

const link = data?.properties?.action_link;

console.log("");
console.log("✅ LINK MÁGICO ADMIN");
console.log("");
console.log(link);
console.log("");
console.log("Destino esperado depois do login:");
console.log(`https://sualuma.online${next}`);
console.log("");
