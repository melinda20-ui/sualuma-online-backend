"use client";

import { useState } from "react";

type OrderBump = {
  name: string;
  price_brl: number;
  description: string;
};

export default function ComprarButton({
  productId,
  orderBump
}: {
  productId: string;
  orderBump?: OrderBump;
}) {
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function buy() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          includeOrderBump
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setMessage(data.error || "Não foi possível abrir o checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setMessage("Erro de conexão ao abrir checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      {orderBump && (
        <label
          style={{
            display: "block",
            padding: 14,
            borderRadius: 16,
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.14)",
            marginBottom: 12,
            cursor: "pointer"
          }}
        >
          <input
            type="checkbox"
            checked={includeOrderBump}
            onChange={(event) => setIncludeOrderBump(event.target.checked)}
            style={{ marginRight: 8 }}
          />
          <strong>Adicionar: {orderBump.name}</strong>
          <br />
          <span style={{ color: "#cbd6ff", fontSize: 13 }}>
            + R$ {orderBump.price_brl} — {orderBump.description}
          </span>
        </label>
      )}

      <button
        onClick={buy}
        disabled={loading}
        style={{
          width: "100%",
          border: 0,
          borderRadius: 16,
          padding: "14px 16px",
          background: "linear-gradient(135deg,#00d4ff,#7c5cff)",
          color: "white",
          fontWeight: 900,
          fontSize: 15,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.75 : 1
        }}
      >
        {loading ? "Abrindo checkout..." : "Comprar e liberar na Mia"}
      </button>

      {message && (
        <p style={{ color: "#ffb4b4", fontSize: 13, marginTop: 10 }}>
          {message}
        </p>
      )}
    </div>
  );
}
