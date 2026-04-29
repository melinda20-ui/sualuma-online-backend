import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const TAG = "usuários excluídos por atualização do sistema";
const TS = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_DIR = path.join("backups", `auth-users-excluidos-${TS}`);
fs.mkdirSync(BACKUP_DIR, { recursive: true });

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split("\n");

  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) continue;

    const index = clean.indexOf("=");
    if (index === -1) continue;

    const key = clean.slice(0, index).trim();
    let value = clean.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl) {
  console.error("ERRO: NEXT_PUBLIC_SUPABASE_URL não encontrada no .env.local.");
  process.exit(1);
}

if (!serviceKey) {
  console.error("");
  console.error("ERRO: chave SERVICE ROLE não encontrada.");
  console.error("Coloque no .env.local uma variável assim:");
  console.error("SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role");
  console.error("");
  console.error("Não use a ANON KEY para apagar usuários.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function getLeadsSchemaColumns() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    const json = await res.json();
    const props =
      json?.definitions?.leads?.properties ||
      json?.components?.schemas?.leads?.properties ||
      {};

    return props;
  } catch {
    return {};
  }
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const batch = data?.users || [];
    users.push(...batch);

    if (batch.length < perPage) break;
    page++;
  }

  return users;
}

function uniqueArray(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function buildTagValue(current, columnType) {
  if (columnType === "array") {
    if (Array.isArray(current)) return uniqueArray([...current, TAG]);
    if (!current) return [TAG];
    return uniqueArray([String(current), TAG]);
  }

  if (columnType === "object") {
    const obj = current && typeof current === "object" && !Array.isArray(current) ? current : {};
    return {
      ...obj,
      system_tag: TAG,
      deleted_auth_user_at: new Date().toISOString(),
    };
  }

  if (!current) return TAG;

  const text = String(current);
  if (text.includes(TAG)) return text;

  return `${text} | ${TAG}`;
}

async function main() {
  console.log("");
  console.log("======================================");
  console.log("1) Buscando usuários do Supabase Auth");
  console.log("======================================");

  const users = await listAllUsers();

  fs.writeFileSync(
    path.join(BACKUP_DIR, "auth-users-backup.json"),
    JSON.stringify(users, null, 2)
  );

  console.log(`Usuários encontrados: ${users.length}`);
  console.log(`Backup salvo em: ${BACKUP_DIR}/auth-users-backup.json`);

  if (users.length === 0) {
    console.log("Nenhum usuário para apagar.");
    return;
  }

  console.log("");
  console.log("======================================");
  console.log("2) Detectando colunas da tabela leads");
  console.log("======================================");

  const leadProps = await getLeadsSchemaColumns();
  const columns = Object.keys(leadProps);

  let emailCol =
    columns.find((c) => c.toLowerCase() === "email") ||
    columns.find((c) => c.toLowerCase().includes("email")) ||
    "email";

  let tagCol =
    columns.find((c) => c === "system_tags") ||
    columns.find((c) => c === "tags") ||
    columns.find((c) => c === "tag") ||
    columns.find((c) => c === "status") ||
    columns.find((c) => c === "observacoes") ||
    columns.find((c) => c === "observacao") ||
    columns.find((c) => c === "notes") ||
    columns.find((c) => c === "nota") ||
    "tags";

  const tagColType = leadProps?.[tagCol]?.type || "string";

  console.log(`Coluna de e-mail usada: ${emailCol}`);
  console.log(`Coluna de tag usada: ${tagCol}`);
  console.log(`Tipo detectado da coluna de tag: ${tagColType}`);

  console.log("");
  console.log("======================================");
  console.log("3) Marcando leads antes de apagar usuários");
  console.log("======================================");

  const leadResults = [];

  for (const user of users) {
    const email = user.email;

    if (!email) {
      leadResults.push({
        user_id: user.id,
        email: null,
        ok: false,
        action: "skip",
        error: "Usuário sem e-mail",
      });
      continue;
    }

    const { data: existing, error: findError } = await supabase
      .from("leads")
      .select("*")
      .ilike(emailCol, email)
      .limit(10);

    if (findError) {
      leadResults.push({
        user_id: user.id,
        email,
        ok: false,
        action: "find_lead",
        error: findError.message,
      });
      continue;
    }

    if (existing && existing.length > 0) {
      for (const lead of existing) {
        const patch = {
          [tagCol]: buildTagValue(lead[tagCol], tagColType),
        };

        if (columns.includes("auth_deleted_at")) {
          patch.auth_deleted_at = new Date().toISOString();
        }

        if (columns.includes("updated_at")) {
          patch.updated_at = new Date().toISOString();
        }

        let query = supabase.from("leads").update(patch);

        if ("id" in lead) {
          query = query.eq("id", lead.id);
        } else {
          query = query.ilike(emailCol, email);
        }

        const { error: updateError } = await query;

        leadResults.push({
          user_id: user.id,
          email,
          ok: !updateError,
          action: "update_lead",
          error: updateError?.message || null,
        });
      }
    } else {
      const insertPayload = {
        [emailCol]: email,
        [tagCol]: buildTagValue(null, tagColType),
      };

      if (columns.includes("nome")) insertPayload.nome = user.user_metadata?.name || user.user_metadata?.full_name || "";
      if (columns.includes("name")) insertPayload.name = user.user_metadata?.name || user.user_metadata?.full_name || "";
      if (columns.includes("origem")) insertPayload.origem = "Usuário da plataforma";
      if (columns.includes("source")) insertPayload.source = "Usuário da plataforma";
      if (columns.includes("auth_user_id")) insertPayload.auth_user_id = user.id;
      if (columns.includes("auth_deleted_at")) insertPayload.auth_deleted_at = new Date().toISOString();

      const { error: insertError } = await supabase.from("leads").insert(insertPayload);

      leadResults.push({
        user_id: user.id,
        email,
        ok: !insertError,
        action: "insert_lead",
        error: insertError?.message || null,
      });
    }
  }

  fs.writeFileSync(
    path.join(BACKUP_DIR, "lead-tag-results.json"),
    JSON.stringify(leadResults, null, 2)
  );

  const leadErrors = leadResults.filter((r) => !r.ok);

  console.log(`Leads processados: ${leadResults.length}`);
  console.log(`Erros em leads: ${leadErrors.length}`);

  if (leadErrors.length > 0) {
    console.log("");
    console.log("ERRO: alguns leads não foram marcados. Por segurança, NÃO apaguei os usuários.");
    console.log(`Veja detalhes em: ${BACKUP_DIR}/lead-tag-results.json`);
    console.log("");
    console.log("Primeiros erros:");
    console.log(JSON.stringify(leadErrors.slice(0, 10), null, 2));
    process.exit(1);
  }

  console.log("");
  console.log("======================================");
  console.log("4) Apagando usuários do Supabase Auth");
  console.log("======================================");

  const deleteResults = [];

  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    deleteResults.push({
      id: user.id,
      email: user.email,
      ok: !error,
      error: error?.message || null,
    });

    console.log(`${error ? "ERRO" : "OK"} - ${user.email || user.id}`);
  }

  fs.writeFileSync(
    path.join(BACKUP_DIR, "auth-delete-results.json"),
    JSON.stringify(deleteResults, null, 2)
  );

  const deleteErrors = deleteResults.filter((r) => !r.ok);

  console.log("");
  console.log("======================================");
  console.log("FINALIZADO");
  console.log("======================================");
  console.log(`Usuários encontrados: ${users.length}`);
  console.log(`Usuários apagados: ${deleteResults.filter((r) => r.ok).length}`);
  console.log(`Erros ao apagar: ${deleteErrors.length}`);
  console.log(`Backup completo em: ${BACKUP_DIR}`);

  if (deleteErrors.length > 0) {
    console.log("");
    console.log("Alguns usuários não foram apagados. Veja:");
    console.log(`${BACKUP_DIR}/auth-delete-results.json`);
  }
}

main().catch((err) => {
  console.error("");
  console.error("FALHOU:");
  console.error(err?.message || err);
  process.exit(1);
});
