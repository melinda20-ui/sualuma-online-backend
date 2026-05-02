import { redirect } from "next/navigation";
import OriginalProviderServicesPage from "./_OriginalProviderServicesPage";
import { getCurrentUserPackageAccess } from "@/lib/auth/package-access";

export default async function ProviderServicesAccessGate() {
  const access = await getCurrentUserPackageAccess();

  if (!access.user) {
    redirect("/login?next=/provider-services&role=provider");
  }

  if (!access.hasServicesClient) {
    redirect("/services/plans?upgrade=services_client&from=provider-services");
  }

  return <OriginalProviderServicesPage />;
}
