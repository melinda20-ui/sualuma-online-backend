import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ServicosPlanosRedirectPage() {
  redirect("/plans?origem=servicos");
}
