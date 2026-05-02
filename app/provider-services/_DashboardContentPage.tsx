import { redirectAdminToStudio } from "@/lib/auth/admin-redirect";
import OriginalProviderServicesPage from "./_OriginalProviderServicesPageWithGate";

export const dynamic = "force-dynamic";

export default async function ProviderServicesPage() {
  await redirectAdminToStudio();
  return <OriginalProviderServicesPage />;
}
