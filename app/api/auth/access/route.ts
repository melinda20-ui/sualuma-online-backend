import { NextResponse } from "next/server";
import { getCurrentUserPackageAccess } from "@/lib/auth/package-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getCurrentUserPackageAccess();

  if (!access.user) {
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        hasIaClient: false,
        hasServicesClient: false,
        hasCompleteAccess: false,
        packages: [],
        error: access.error,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    email: access.email,
    hasIaClient: access.hasIaClient,
    hasServicesClient: access.hasServicesClient,
    hasCompleteAccess: access.hasCompleteAccess,
    packages: access.packages,
  });
}
