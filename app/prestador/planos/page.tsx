import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PrestadorPlanosRedirectPage() {
  redirect("/plans?origem=prestador");
}
