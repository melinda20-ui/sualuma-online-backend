import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin-access";

const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

export default async function ChatCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email?.toLowerCase() || null;

  const allowed = Boolean(email && ADMIN_EMAILS.has(email));

  if (!allowed) {
    const headersList = await headers();
    const host = headersList.get("host") || "sualuma.online";
    const proto = headersList.get("x-forwarded-proto") || "https";
    const fullUrl = `${proto}://${host}/chatcode`;
    redirect(`/login?next=${encodeURIComponent(fullUrl)}&role=admin`);
  }

  return <>{children}</>;
}
