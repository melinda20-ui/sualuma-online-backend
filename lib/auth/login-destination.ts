export const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

export function isAdminEmail(email?: string | null) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function getLoginDestination(email?: string | null) {
  return isAdminEmail(email) ? "/studio-lab" : "/portal";
}
