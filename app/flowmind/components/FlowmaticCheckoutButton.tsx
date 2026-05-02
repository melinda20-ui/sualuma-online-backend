"use client";

import { useState } from "react";

export default function FlowmaticCheckoutButton({
  kind,
  slug,
  children,
  className = "fm-commerce-btn primary full",
}: {
  kind: "plan" | "template";
  slug: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function startCheckout() {
    try {
      setStatus("loading");
      setError("");

      const response = await fetch("/api/flowmind/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kind, slug }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro ao iniciar checkout.");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      throw new Error("Checkout não retornou URL.");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro ao iniciar checkout.");
    }
  }

  return (
    <div className="fm-checkout-button-wrap">
      <button
        className={className}
        onClick={startCheckout}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Abrindo checkout..." : children}
      </button>

      {status === "error" && <p className="fm-checkout-error">{error}</p>}
    </div>
  );
}
