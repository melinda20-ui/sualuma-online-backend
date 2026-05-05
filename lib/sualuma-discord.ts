type DiscordPayload = {
  content?: string;
  embeds?: Array<Record<string, unknown>>;
  username?: string;
  avatar_url?: string;
};

export async function sendDiscord(payload: DiscordPayload) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) {
    return { ok: false, status: 0, error: "DISCORD_WEBHOOK_URL ausente." };
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Sualuma OS",
        allowed_mentions: { parse: [] },
        ...payload
      })
    });

    const text = await res.text().catch(() => "");

    return {
      ok: res.ok,
      status: res.status,
      text
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      error: error?.message || "Erro ao enviar Discord."
    };
  }
}
