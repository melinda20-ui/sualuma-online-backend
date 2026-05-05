const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, ".env.local");
const BLOG_STATE_FILE = path.join(ROOT, "data", "discord", "blog-milestone-state.json");

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;

  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;

    const [key, ...rest] = clean.split("=");
    const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) process.env[key] = value;
  }
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(file);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function notifyDiscord(content) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) {
    console.log("[discord] webhook ausente");
    return;
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Sualuma Orchestrator",
        allowed_mentions: { parse: [] },
        content: String(content).slice(0, 1900)
      })
    });

    console.log("[discord]", res.status);
  } catch (error) {
    console.log("[discord erro]", error.message);
  }
}

async function hit(endpoint) {
  const secret = process.env.DISCORD_NOTIFY_SECRET || "";
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `http://127.0.0.1:3000${endpoint}${secret ? `${separator}secret=${encodeURIComponent(secret)}` : ""}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      return { ok: res.ok, status: res.status, text };
    }
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleBlogMilestone(blog) {
  const drafts = Number(blog?.drafts || 0);
  const withImage = Number(blog?.withImage || 0);
  const withSeo = Number(blog?.withSeo || 0);
  const total = Number(blog?.total || 0);

  const state = readJson(BLOG_STATE_FILE, {
    lastDraftMilestone: 0
  });

  const milestone = Math.floor(drafts / 15) * 15;

  if (milestone >= 15 && milestone > Number(state.lastDraftMilestone || 0)) {
    await notifyDiscord(
      `📝 **Nova finalizou um lote de ${milestone} artigos para revisão.**\n` +
      `Total monitorado: ${total}\n` +
      `Rascunhos: ${drafts}\n` +
      `Com SEO: ${withSeo}\n` +
      `Com imagem: ${withImage}\n\n` +
      `Ação necessária: entrar em **/studio/blog-agent**, ler, avaliar imagens e aprovar. Depois disso o fluxo segue para Google/SEO, publicação e reaproveitamento em Instagram, LinkedIn e YouTube.`
    );

    state.lastDraftMilestone = milestone;
    state.updatedAt = new Date().toISOString();
    writeJson(BLOG_STATE_FILE, state);
  }
}

async function runOnce(reason) {
  console.log(`[orchestrator] ciclo: ${reason} - ${new Date().toISOString()}`);

  const diagnostics = await hit("/api/studio/system-diagnostics-auto");
  console.log("[diagnostico]", diagnostics.ok, diagnostics.health);

  const tasksOpen = await hit("/api/studio/tasks-discord-sync");
  console.log("[tarefas abertas]", tasksOpen.ok, tasksOpen.notified ?? "-");

  const tasksDone = await hit("/api/studio/tasks-completion-watch");
  console.log("[tarefas concluidas]", tasksDone.ok, tasksDone.pending ?? "-");

  const blog = await hit("/api/studio/blog-agent-auto");
  console.log("[blog]", blog.ok, "total:", blog.total, "drafts:", blog.drafts);

  await handleBlogMilestone(blog);
}

loadEnv();

runOnce("start").catch((error) => {
  console.log("[orchestrator erro start]", error.message);
});

setInterval(() => {
  runOnce("20min").catch((error) => {
    console.log("[orchestrator erro ciclo]", error.message);
  });
}, 20 * 60 * 1000);
