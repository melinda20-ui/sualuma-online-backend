const fs = require("fs");

const BASE = process.env.SUALUMA_INTERNAL_BASE || "http://127.0.0.1:3000";
const INTERVAL = 20 * 60 * 1000;

function readSecret() {
  try {
    const env = fs.readFileSync("/root/luma-os/.env.local", "utf8");
    const line = env.split("\n").find((item) => item.startsWith("DISCORD_NOTIFY_SECRET="));
    if (!line) return "";
    return line.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

async function waitNext() {
  for (let i = 1; i <= 60; i++) {
    try {
      const res = await fetch(BASE, { method: "HEAD" });
      if (res.status < 500) return true;
    } catch {}
    console.log(`[canvas-squad] aguardando Next ${i}/60`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function run() {
  const secret = readSecret();
  const qs = secret ? `?secret=${encodeURIComponent(secret)}` : "";

  try {
    await waitNext();

    const sync = await fetch(`${BASE}/api/studio/canvas-empresa${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync-tasks", notify: false })
    });

    const syncText = await sync.text();

    const sep = secret ? `&` : `?`;
    const notify = await fetch(`${BASE}/api/studio/canvas-empresa${qs}${sep}notify=1`);
    const notifyText = await notify.text();

    console.log(`[canvas-squad] ${new Date().toISOString()} sync=${sync.status} ${syncText.slice(0, 220)}`);
    console.log(`[canvas-squad] ${new Date().toISOString()} notify=${notify.status} ${notifyText.slice(0, 220)}`);
  } catch (error) {
    console.error("[canvas-squad] erro", error?.message || error);
  }
}

console.log("[canvas-squad] iniciado. Canvas + SWOT + 5W2H a cada 20 minutos.");
run();
setInterval(run, INTERVAL);
