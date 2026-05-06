import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.env.TENANT_DATA_ROOT || path.join(process.cwd(), "data", "tenants");

function safeName(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 80);
}

export function tenantIdFromUserId(userId: string) {
  if (!userId) throw new Error("userId obrigatório para criar a casa do usuário.");

  const hash = crypto
    .createHash("sha256")
    .update(userId)
    .digest("hex")
    .slice(0, 16);

  return `user_${hash}`;
}

export function normalizeTenantId(tenantId: string) {
  const safe = safeName(tenantId);

  if (!safe) {
    throw new Error("tenantId inválido.");
  }

  return safe;
}

export function getTenantDir(tenantId: string) {
  const safeTenantId = normalizeTenantId(tenantId);
  const dir = path.join(ROOT, safeTenantId);

  fs.mkdirSync(dir, { recursive: true });

  return dir;
}

export function tenantFilePath(tenantId: string, fileName: string) {
  const dir = getTenantDir(tenantId);
  const safeFile = safeName(fileName).replace(/_json$/, "") + ".json";
  const fullPath = path.resolve(dir, safeFile);

  if (!fullPath.startsWith(path.resolve(ROOT))) {
    throw new Error("Caminho bloqueado por segurança.");
  }

  return fullPath;
}

export function readTenantJson<T>(tenantId: string, fileName: string, fallback: T): T {
  const file = tenantFilePath(tenantId, fileName);

  if (!fs.existsSync(file)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeTenantJson<T>(tenantId: string, fileName: string, data: T) {
  const file = tenantFilePath(tenantId, fileName);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");

  return {
    ok: true,
    tenantId: normalizeTenantId(tenantId),
    file,
  };
}
