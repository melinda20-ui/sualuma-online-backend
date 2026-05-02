import { redirect } from "next/navigation";
import { getDashboardAccess } from "@/lib/auth/dashboard-access";
import DashboardContentPage from "./_DashboardContentPage";

export const dynamic = "force-dynamic";

export default async function ProviderServicesPage() {
  const access = await getDashboardAccess();

  if (!access.authenticated) {
    redirect("/login?next=/provider-services&role=provider");
  }

  if (!access.isAdmin && !access.hasProvider) {
    redirect("/prestador/planos");
  }

  return <DashboardContentPage />;
}
