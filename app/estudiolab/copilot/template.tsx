import { requireAdmin } from "@/lib/auth/admin-access";

export default async function EstudioLabOldProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/estudiolab/copilot");
  return <>{children}</>;
}
