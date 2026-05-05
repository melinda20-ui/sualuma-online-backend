#!/usr/bin/env node

const fs = require("fs");
const http = require("http");

function readSecret() {
  try {
    const env = fs.readFileSync(".env.local", "utf8");
    const line = env.split(/\r?\n/).find((item) => item.startsWith("DISCORD_NOTIFY_SECRET="));
    if (!line) return "";
    return line.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

function request(pathname) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: pathname,
        timeout: 15000
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );

    req.on("error", (error) => resolve({ status: 0, body: error.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, body: "timeout" });
    });
  });
}

async function run() {
  const secret = encodeURIComponent(readSecret());
  const url = `/api/studio/onboarding-board?sync=1&notify=1&secret=${secret}`;
  const result = await request(url);
  console.log(`[onboarding-squad] ${new Date().toISOString()} status=${result.status} ${String(result.body).slice(0, 500)}`);
}

console.log("[onboarding-squad] iniciado. Growth + UX + Lançamento supervisionando a cada 20 minutos.");
run();
setInterval(run, 20 * 60 * 1000);
