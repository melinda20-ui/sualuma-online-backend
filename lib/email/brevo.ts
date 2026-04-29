type SendBrevoEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendBrevoEmail(input: SendBrevoEmailInput) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_FROM_EMAIL || "contato@sualuma.online";
  const senderName = process.env.BREVO_FROM_NAME || "Sualuma";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY não configurada.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: input.to,
        },
      ],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text || input.subject,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Erro Brevo ${response.status}: ${body}`);
  }

  return body;
}
