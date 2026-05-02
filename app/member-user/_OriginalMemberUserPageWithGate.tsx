import { redirect } from "next/navigation";
import OriginalMemberUserPage from "./_OriginalMemberUserPage";
import { getCurrentUserPackageAccess } from "@/lib/auth/package-access";

export default async function MemberUserAccessGate() {
  const access = await getCurrentUserPackageAccess();

  if (!access.user) {
    redirect("/login?next=/member-user&role=client");
  }

  if (!access.hasIaClient) {
    redirect("/plans?upgrade=ia_client&from=member-user");
  }

  return <OriginalMemberUserPage />;
}
