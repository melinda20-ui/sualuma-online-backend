import { requireAdmin } from "@/lib/auth/admin-access";

export default async function EstudioLabCrescimentoProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/estudio-lab/crescimento");
  return <>{children}</>;
}
