import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin-access";

export default async function StudioProtectedTemplate({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin("/studio/usuarios-diagnostico");
  return <>{children}</>;
}
