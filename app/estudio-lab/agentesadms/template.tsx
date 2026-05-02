import { requireAdmin } from "@/lib/auth/admin-access";

export default async function EstudioLabAgentesProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/estudio-lab/agentesadms");
  return <>{children}</>;
}
