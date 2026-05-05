type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
};

export async function sendDiscordMessage(input: {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
}) {
  const webhook =
    process.env.DISCORD_WEBHOOK_URL?.trim() ||
    process.env.DISCORD_WEBHOOK?.trim();

  if (!webhook) {
    return { ok: false, skipped: true, error: "DISCORD_WEBHOOK_URL ausente." };
  }

  if (!/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(webhook)) {
    return { ok: false, error: "Webhook do Discord inválido." };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username || "Sualuma OS",
      content: input.content || "",
      embeds: input.embeds || [],
      allowed_mentions: { parse: [] }
    })
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    return { ok: false, status: res.status, error: text || res.statusText };
  }

  return { ok: true, status: res.status };
}
