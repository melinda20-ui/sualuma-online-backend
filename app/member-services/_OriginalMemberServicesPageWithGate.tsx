import { redirect } from "next/navigation";
import OriginalMemberServicesPage from "./_OriginalMemberServicesPage";
import { getCurrentUserPackageAccess } from "@/lib/auth/package-access";

export default async function MemberServicesAccessGate() {
  const access = await getCurrentUserPackageAccess();

  if (!access.user) {
    redirect("/login?next=/member-services");
  }

  if (!access.hasServicesClient) {
    redirect("/services/plans?upgrade=services_client&from=member-services");
  }

  return <OriginalMemberServicesPage />;
}
