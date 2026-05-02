import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin-access";

export default async function StudioLabProtectedTemplate({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin("/studio-lab");
  return <>{children}</>;
}
