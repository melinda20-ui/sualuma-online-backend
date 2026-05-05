#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PROJECT_DIR = "/root/luma-os";
const ENV_FILE = path.join(PROJECT_DIR, ".env.local");
const BASE = process.env.SUALUMA_INTERNAL_BASE || "http://127.0.0.1:3000";
const INTERVAL_MS = 20 * 60 * 1000;

function readEnv(name) {
  try {
    const txt = fs.readFileSync(ENV_FILE, "utf8");
    const line = txt.split(/\r?\n/).find((item) => item.startsWith(name + "="));
    if (!line) return "";
    return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

const secret = process.env.DISCORD_NOTIFY_SECRET || readEnv("DISCORD_NOTIFY_SECRET");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitNext() {
  for (let i = 1; i <= 60; i++) {
    try {
      const res = await fetch(BASE, { method: "HEAD" });
      if (res.status < 500) return true;
    } catch {}
    console.log(`[launch-squad] aguardando Next ${i}/60`);
    await sleep(1000);
  }
  return false;
}

async function runCycle() {
  const started = new Date().toISOString();

  try {
    await waitNext();

    const url =
      BASE +
      "/api/studio/launch-squad-auto" +
      (secret ? `?secret=${encodeURIComponent(secret)}` : "");

    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    console.log(`[launch-squad] ${started} status=${res.status} ${text.slice(0, 500)}`);
  } catch (error) {
    console.error("[launch-squad] erro no ciclo:", error && error.message ? error.message : error);
  }
}

console.log("[launch-squad] iniciado. Relatórios a cada 20 minutos.");
runCycle();
setInterval(runCycle, INTERVAL_MS);
