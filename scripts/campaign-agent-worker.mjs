import fs from "fs";
import path from "path";

const root = process.cwd();

function loadEnv(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;

  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;
    const [key, ...rest] = clean.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
}

loadEnv(".env");
loadEnv(".env.local");

const baseUrl = process.env.CAMPAIGN_AGENT_BASE_URL || "http://127.0.0.1:3000";
const secret = process.env.CAMPAIGN_AGENT_SECRET;
const intervalMs = Number(process.env.CAMPAIGN_AGENT_INTERVAL_MS || 15 * 60 * 1000);

if (!secret) {
  console.error("[campaign-agent] CAMPAIGN_AGENT_SECRET não configurado.");
  process.exit(1);
}

async function runBatch() {
  try {
    const res = await fetch(`${baseUrl}/api/campaign-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-campaign-agent-secret": secret,
      },
      body: JSON.stringify({ action: "run-batch" }),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[campaign-agent] ${new Date().toISOString()} status=${res.status} added=${data.added ?? 0} ready=${data.ready ?? 0} sent=${data.sent ?? 0} total=${data.total ?? "?"} msg=${data.message || data.state?.lastMessage || data.error || "ok"}`);
  } catch (err) {
    console.error("[campaign-agent] erro:", err?.message || err);
  }
}

console.log(`[campaign-agent] iniciado. Rodando a cada ${Math.round(intervalMs / 60000)} min.`);
await runBatch();
setInterval(runBatch, intervalMs);
