import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ServicesPlansRedirectPage() {
  redirect("/plans?origem=servicos");
}
