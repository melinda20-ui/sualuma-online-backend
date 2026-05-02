import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_STUDIO_URL =
  process.env.NEXT_PUBLIC_ADMIN_STUDIO_URL || "https://studio.sualuma.online";

const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

export async function redirectAdminToStudio() {
  let shouldRedirect = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    const email = data?.user?.email?.toLowerCase()?.trim();

    if (email && ADMIN_EMAILS.has(email)) {
      shouldRedirect = true;
    }
  } catch {
    // Não quebra página pública se a sessão/cookie estiver inválido.
  }

  if (shouldRedirect) {
    redirect(ADMIN_STUDIO_URL);
  }
}
