import fs from "fs";
import path from "path";

function loadEnvFile(file) {
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

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL) {
  console.error("ERRO: não encontrei SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("ERRO: não encontrei SUPABASE_SERVICE_ROLE_KEY.");
  console.error("");
  console.error("Rode antes, sem me mandar a chave:");
  console.error("export SUPABASE_SERVICE_ROLE_KEY='COLE_A_SERVICE_ROLE_KEY_AQUI'");
  console.error("node scripts/setup-admin-users.mjs");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

const admins = [
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
];

const password = "15593688613@adm";

async function supabaseFetch(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object"
        ? data?.message || data?.error_description || data?.error || JSON.stringify(data)
        : data;

    throw new Error(`${response.status} ${response.statusText}: ${message}`);
  }

  return data;
}

async function listAllUsers() {
  let page = 1;
  const perPage = 1000;
  const all = [];

  while (true) {
    const data = await supabaseFetch(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      method: "GET",
    });

    const users = Array.isArray(data) ? data : data?.users || [];
    all.push(...users);

    if (users.length < perPage) break;
    page++;
  }

  return all;
}

async function findUserByEmail(email) {
  const users = await listAllUsers();
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
}

async function createOrUpdateUser(email) {
  const existing = await findUserByEmail(email);

  if (existing) {
    console.log(`ℹ️ Usuário já existe, atualizando senha e confirmação: ${email}`);

    await supabaseFetch(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: {
          ...(existing.user_metadata || {}),
          app_role: "super_admin",
          sualuma_admin: true,
        },
      }),
    });

    return existing;
  }

  const created = await supabaseFetch("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        app_role: "super_admin",
        sualuma_admin: true,
      },
    }),
  });

  console.log(`✅ Usuário admin criado: ${email}`);
  return created;
}

async function upsertAdminRows() {
  const rows = admins.map((email) => ({
    email: email.toLowerCase(),
    role: "super_admin",
    is_active: true,
    notes: "Administrador soberano criado pelo setup administrativo.",
  }));

  await supabaseFetch("/rest/v1/app_admins?on_conflict=email", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  console.log("✅ app_admins atualizado.");
}

async function main() {
  for (const email of admins) {
    await createOrUpdateUser(email.toLowerCase());
  }

  await upsertAdminRows();

  console.log("");
  console.log("Pronto ✅");
  console.log("");
  console.log("Administradores liberados:");
  for (const email of admins) {
    console.log(`- ${email.toLowerCase()}`);
  }
  console.log("");
  console.log("Senha definida para todos:");
  console.log(password);
}

main().catch((error) => {
  console.error("ERRO:");
  console.error(error.message || error);
  process.exit(1);
});
