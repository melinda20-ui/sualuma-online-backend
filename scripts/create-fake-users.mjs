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

    if (!process.env[key]) {
      process.env[key] = value;
    }
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
  console.error("ERRO: não encontrei SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL no .env.");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("ERRO: não encontrei SUPABASE_SERVICE_ROLE_KEY no .env.");
  console.error("");
  console.error("Você precisa colocar a service role key no terminal, sem me mandar aqui:");
  console.error("export SUPABASE_SERVICE_ROLE_KEY='COLE_SUA_SERVICE_ROLE_KEY_AQUI'");
  console.error("");
  console.error("Depois rode de novo:");
  console.error("node scripts/create-fake-users.mjs");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

const testUsers = [
  {
    email: "teste.ia@sualuma.online",
    password: "Teste@123456",
    packages: [
      {
        package_code: "ia_client",
        plan_name: "Cliente IA",
        plan_slug: "cliente-ia",
      },
    ],
  },
  {
    email: "teste.servico@sualuma.online",
    password: "Teste@123456",
    packages: [
      {
        package_code: "services_client",
        plan_name: "Meu Serviço",
        plan_slug: "meu-servico",
      },
    ],
  },
  {
    email: "teste.completo@sualuma.online",
    password: "Teste@123456",
    packages: [
      {
        package_code: "ia_client",
        plan_name: "Cliente IA",
        plan_slug: "cliente-ia",
      },
      {
        package_code: "services_client",
        plan_name: "Meu Serviço",
        plan_slug: "meu-servico",
      },
    ],
  },
];

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

async function createOrGetUser(fakeUser) {
  console.log(`\nCriando/verificando usuário: ${fakeUser.email}`);

  try {
    const created = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: fakeUser.email,
        password: fakeUser.password,
        email_confirm: true,
        user_metadata: {
          name: fakeUser.email.split("@")[0],
          fake_test_user: true,
        },
      }),
    });

    console.log(`✅ Usuário criado: ${fakeUser.email}`);
    return created;
  } catch (error) {
    const message = String(error.message || "");

    if (
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("User already")
    ) {
      const existing = await findUserByEmail(fakeUser.email);

      if (!existing) {
        throw new Error(`Usuário já existia, mas não consegui encontrar o ID: ${fakeUser.email}`);
      }

      console.log(`ℹ️ Usuário já existia: ${fakeUser.email}`);
      return existing;
    }

    throw error;
  }
}

async function upsertPackages(user, fakeUser) {
  const rows = fakeUser.packages.map((pkg) => ({
    user_id: user.id,
    package_code: pkg.package_code,
    status: "active",
    plan_name: pkg.plan_name,
    plan_slug: pkg.plan_slug,
    source: "manual",
    notes: "Usuário fake criado para teste de acesso.",
  }));

  await supabaseFetch("/rest/v1/user_package_access?on_conflict=user_id,package_code", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  console.log(`✅ Pacotes aplicados para ${fakeUser.email}:`);
  for (const row of rows) {
    console.log(`   - ${row.package_code} / ${row.status}`);
  }
}

async function verifyAccess() {
  console.log("\nVerificando acessos gravados:");

  const data = await supabaseFetch(
    "/rest/v1/user_package_access?select=user_id,package_code,status,plan_name,plan_slug,source,created_at&order=created_at.desc",
    { method: "GET" }
  );

  const relevant = data.filter((row) =>
    ["ia_client", "services_client"].includes(row.package_code)
  );

  console.table(
    relevant.map((row) => ({
      user_id: row.user_id,
      pacote: row.package_code,
      status: row.status,
      plano: row.plan_name,
      origem: row.source,
    }))
  );
}

async function main() {
  console.log("Iniciando criação de usuários fakes...");
  console.log("URL Supabase:", SUPABASE_URL);
  console.log("Service role key:", SERVICE_ROLE_KEY ? "encontrada ✅" : "não encontrada ❌");

  for (const fakeUser of testUsers) {
    const user = await createOrGetUser(fakeUser);
    await upsertPackages(user, fakeUser);
  }

  await verifyAccess();

  console.log("\nPronto ✅");
  console.log("");
  console.log("Usuários de teste:");
  console.log("1) teste.ia@sualuma.online / Teste@123456 → só IA");
  console.log("2) teste.servico@sualuma.online / Teste@123456 → só Serviços");
  console.log("3) teste.completo@sualuma.online / Teste@123456 → IA + Serviços");
}

main().catch((error) => {
  console.error("\nERRO:");
  console.error(error.message || error);
  process.exit(1);
});
