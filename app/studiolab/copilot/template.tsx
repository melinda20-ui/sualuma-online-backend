import { requireAdmin } from "@/lib/auth/admin-access";

export default async function StudioLabOldProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/studiolab/copilot");
  return <>{children}</>;
}
