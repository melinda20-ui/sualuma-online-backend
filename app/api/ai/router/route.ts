export async function POST(req: Request) {
  try {
    const body = await req.json();
    const originalPrompt = body.prompt || "";
    const prompt = originalPrompt.toLowerCase();

    if (!prompt) {
      return Response.json({
        ok: false,
        error: "Prompt vazio",
      });
    }

    const automationHints = [
      "n8n",
      "workflow",
      "automação",
      "automacao",
      "fluxo",
      "pipeline",
      "webhook",
      "gatilho",
      "trigger",
      "popup",
      "formulário",
      "formulario",
      "google sheets",
      "planilha",
      "email",
      "e-mail",
    ];

    const isAutomation = automationHints.some((hint) =>
      prompt.includes(hint)
    );

    if (isAutomation) {
      let workflowName = "Workflow Personalizado";
      let description = "Fluxo automatizado criado com base no pedido do usuário.";
      let steps: string[] = [];
      let nodes: { type: string; name: string }[] = [];

      const wantsPopup = prompt.includes("popup");
      const wantsEmail =
        prompt.includes("email") || prompt.includes("e-mail");
      const wantsSheets =
        prompt.includes("google sheets") ||
        prompt.includes("planilha") ||
        prompt.includes("excel");
      const wantsLeadCapture =
        prompt.includes("lead") || prompt.includes("captar");

      if (wantsPopup && wantsEmail && wantsSheets) {
        workflowName = "Captura de e-mail em popup + Google Sheets";
        description =
          "Captura o e-mail digitado no popup, valida os dados e salva automaticamente em uma planilha do Google Sheets.";

        steps = [
          "Exibir popup com campo de e-mail",
          "Receber o e-mail enviado pelo usuário",
          "Validar se o e-mail foi preenchido corretamente",
          "Enviar os dados para o workflow",
          "Salvar o e-mail em uma planilha do Google Sheets",
          "Retornar confirmação de cadastro",
        ];

        nodes = [
          {
            type: "trigger",
            name: "Receber envio do popup",
          },
          {
            type: "validation",
            name: "Validar e-mail",
          },
          {
            type: "google_sheets",
            name: "Salvar na planilha",
          },
          {
            type: "response",
            name: "Confirmar cadastro",
          },
        ];
      } else if (wantsLeadCapture) {
        workflowName = "Lead Capture Workflow";
        description =
          "Fluxo para captar leads e iniciar contato automático.";

        steps = [
          "Receber lead por formulário ou webhook",
          "Validar dados obrigatórios",
          "Salvar no CRM ou banco de dados",
          "Enviar mensagem inicial",
          "Notificar equipe comercial",
          "Agendar follow-up",
        ];

        nodes = [
          {
            type: "webhook",
            name: "Receber Lead",
          },
          {
            type: "validation",
            name: "Validar Dados",
          },
          {
            type: "database",
            name: "Salvar Lead",
          },
          {
            type: "notification",
            name: "Avisar Comercial",
          },
        ];
      } else {
        workflowName = "Automação personalizada";
        description =
          "Fluxo criado com base na solicitação enviada pelo usuário.";

        steps = [
          "Interpretar o pedido do usuário",
          "Estruturar a automação",
          "Organizar as etapas principais",
          "Preparar para importação no n8n",
        ];

        nodes = [
          {
            type: "trigger",
            name: "Entrada inicial",
          },
          {
            type: "logic",
            name: "Processamento",
          },
          {
            type: "output",
            name: "Saída final",
          },
        ];
      }

      return Response.json({
        ok: true,
        mode: "automation",
        reply: "Automação estruturada com base no seu pedido.",
        askToImport: true,
        json: {
          name: workflowName,
          description,
          sourcePrompt: originalPrompt,
          steps,
          nodes,
        },
      });
    }

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:3b",
        prompt: originalPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Erro no Ollama: " + errorText);
    }

    const data = await response.json();

    return Response.json({
      ok: true,
      mode: "chat",
      reply: data.response,
    });
  } catch (error: any) {
    return Response.json({
      ok: false,
      error: error.message,
    });
  }
}
