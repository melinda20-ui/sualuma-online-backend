import fs from "fs";
import path from "path";

const root = process.cwd();

function loadEnv(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;

  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;
    const [key, ...rest] = clean.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv(".env");
loadEnv(".env.local");

const baseUrl = process.env.LEADS_PROSPECTOR_BASE_URL || "http://127.0.0.1:3000";
const secret = process.env.LEADS_PROSPECTOR_SECRET;
const intervalMs = Number(process.env.LEADS_PROSPECTOR_INTERVAL_MS || 15 * 60 * 1000);

if (!secret) {
  console.error("[leads-prospector-agent] LEADS_PROSPECTOR_SECRET não configurado.");
  process.exit(1);
}

async function runBatch() {
  try {
    const res = await fetch(`${baseUrl}/api/leads-prospector/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-leads-prospector-secret": secret
      },
      body: JSON.stringify({ action: "run-batch" })
    });

    const data = await res.json().catch(() => ({}));
    console.log(
      `[leads-prospector-agent] ${new Date().toISOString()} status=${res.status} added=${data.added ?? 0} total=${data.total ?? data.state?.collected ?? "?"} msg=${data.message || data.error || "ok"}`
    );
  } catch (err) {
    console.error("[leads-prospector-agent] erro:", err?.message || err);
  }
}

console.log(`[leads-prospector-agent] iniciado. Rodando a cada ${Math.round(intervalMs / 60000)} min.`);
await runBatch();
setInterval(runBatch, intervalMs);
