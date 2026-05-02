import { redirect } from "next/navigation";
import { getDashboardAccess } from "@/lib/auth/dashboard-access";
import DashboardContentPage from "./_DashboardContentPage";

export const dynamic = "force-dynamic";

export default async function MemberServicesPage() {
  const access = await getDashboardAccess();

  if (!access.authenticated) {
    redirect("/login?next=/member-services&role=client");
  }

  return <DashboardContentPage />;
}
