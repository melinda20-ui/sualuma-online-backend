import { redirectAdminToStudio } from "@/lib/auth/admin-redirect";
import OriginalMemberServicesPage from "./_OriginalMemberServicesPageWithGate";

export const dynamic = "force-dynamic";

export default async function MemberServicesPage() {
  await redirectAdminToStudio();
  return <OriginalMemberServicesPage />;
}
