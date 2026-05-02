import { requireAdmin } from "@/lib/auth/admin-access";

export default async function EstudioLabCopilotProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/estudio-lab/copilot");
  return <>{children}</>;
}
