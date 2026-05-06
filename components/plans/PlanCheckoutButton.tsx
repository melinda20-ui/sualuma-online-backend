"use client";

import { useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export type PlanKey = "free" | "basico" | "prime" | "premium" | "ia_pro";

type Props = {
  plan: PlanKey;
  label: string;
  highlight?: boolean;
};

export default function PlanCheckoutButton({ plan, label, highlight = false }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabaseClient();

  async function startCheckout() {
    try {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        window.location.href = `/login?next=${encodeURIComponent("/portal")}`;
        return;
      }

      if (plan === "free") {
        window.location.href = "/portal?plan=free";
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
          email: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.checkoutUrl) {
        alert(result?.error || "Não foi possível abrir o checkout agora.");
        return;
      }

      window.location.href = result.checkoutUrl;
    } catch (error) {
      console.error("[plans] checkout:", error);
      alert("Erro ao iniciar o checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading}
      className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        highlight
          ? "bg-[#7A00FF] text-white hover:brightness-110"
          : "border border-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.08]"
      }`}
    >
      {loading ? "Abrindo..." : label}
    </button>
  );
}
