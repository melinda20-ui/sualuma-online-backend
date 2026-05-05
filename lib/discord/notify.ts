export async function sendDiscordMessage(content: string) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) {
    return { ok: false, status: 0, error: "DISCORD_WEBHOOK_URL não configurado." };
  }

  async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });

    if (res.status === 204 || res.status === 200) {
      return { ok: true, status: res.status };
    }

    const text = await res.text().catch(() => "");

    if (res.status === 429) {
      let retryAfter = 1000;

      try {
        const data = JSON.parse(text);
        retryAfter = Math.ceil(Number(data.retry_after || 1) * 1000) + 500;
      } catch {}

      await sleep(retryAfter);
      continue;
    }

    return { ok: false, status: res.status, error: text };
  }

  return { ok: false, status: 429, error: "Discord limitou as mensagens mesmo após novas tentativas." };
}
