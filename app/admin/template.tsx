import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin-access";

export default async function AdminProtectedTemplate({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin("/admin");
  return <>{children}</>;
}
