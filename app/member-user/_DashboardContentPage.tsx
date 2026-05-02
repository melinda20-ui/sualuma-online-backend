import { redirectAdminToStudio } from "@/lib/auth/admin-redirect";
import OriginalMemberUserPage from "./_OriginalMemberUserPageWithGate";

export const dynamic = "force-dynamic";

export default async function MemberUserPage() {
  await redirectAdminToStudio();
  return <OriginalMemberUserPage />;
}
