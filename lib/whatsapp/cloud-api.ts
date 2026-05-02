export type WhatsAppSendResult = {
  configured: boolean;
  provider: "meta_graph_whatsapp";
  status: "sent" | "not_configured" | "failed";
  to?: string;
  messageId?: string | null;
  error?: string;
};

function cleanPhone(value?: string | null) {
  return String(value || "").replace(/\D/g, "");
}

export function isWhatsAppCloudConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_TO_NUMBER
  );
}

export async function sendWhatsAppText(message: string, toNumber?: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v25.0";
  const to = cleanPhone(toNumber || process.env.WHATSAPP_TO_NUMBER);

  if (!token || !phoneNumberId || !to) {
    return {
      configured: false,
      provider: "meta_graph_whatsapp",
      status: "not_configured",
      error: "Variáveis WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_TO_NUMBER não configuradas.",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: String(message || "").slice(0, 3900),
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        configured: true,
        provider: "meta_graph_whatsapp",
        status: "failed",
        to,
        error:
          data?.error?.message ||
          data?.message ||
          `Falha HTTP ${response.status} ao enviar WhatsApp.`,
      };
    }

    return {
      configured: true,
      provider: "meta_graph_whatsapp",
      status: "sent",
      to,
      messageId: data?.messages?.[0]?.id || null,
    };
  } catch (error: any) {
    return {
      configured: true,
      provider: "meta_graph_whatsapp",
      status: "failed",
      to,
      error: error?.message || "Erro inesperado ao enviar WhatsApp.",
    };
  }
}
