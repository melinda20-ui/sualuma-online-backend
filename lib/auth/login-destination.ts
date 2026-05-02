export const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

export function isSualumaAdmin(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.has(email.toLowerCase().trim()));
}

export function getLoginDestination(email?: string | null) {
  if (isSualumaAdmin(email)) return "/studio-lab";
  return "/portal";
}
