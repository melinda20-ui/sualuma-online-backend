#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT = "/root/luma-os";
const REPORT_DIR = path.join(ROOT, "reports/copilot");
const REPORT = path.join(REPORT_DIR, "launch-auditor.json");

fs.mkdirSync(REPORT_DIR, { recursive: true });

function read(file) {
  try { return fs.readFileSync(path.join(ROOT, file), "utf8"); } catch { return ""; }
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function existsAny(files) {
  return files.some(exists);
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function sh(cmd, timeout = 20000) {
  try {
    return cp.execSync(cmd, {
      cwd: ROOT,
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (e) {
    const out = e.stdout ? e.stdout.toString() : "";
    const err = e.stderr ? e.stderr.toString() : "";
    return (out || err || "").trim();
  }
}

function envHas(key) {
  const envText = read(".env") + "\n" + read(".env.local");
  const re = new RegExp(`^${key}=.+`, "m");
  return re.test(envText);
}

async function fetchInfo(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "SualumaLaunchAuditor/1.0" },
    });

    clearTimeout(timer);

    let body = "";
    try { body = await res.text(); } catch {}

    return {
      url,
      status: res.status,
      ok: res.ok,
      location: res.headers.get("location") || "",
      body: body.slice(0, 800),
    };
  } catch (e) {
    return {
      url,
      status: 0,
      ok: false,
      location: "",
      body: String(e.message || e).slice(0, 300),
    };
  }
}

function severityWeight(severity) {
  if (severity === "alta") return 12;
  if (severity === "media") return 7;
  return 4;
}

function shortList(text, max = 12) {
  return String(text || "")
    .split("\n")
    .filter(Boolean)
    .slice(0, max)
    .join("\n");
}

async function main() {
  const now = new Date().toISOString();
  const old = readJson(REPORT, { tasks: [] });
  const oldMap = new Map((old.tasks || []).map((t) => [t.id, t]));
  const issues = [];
  const sections = [];

  function addTask(task) {
    issues.push({
      id: task.id,
      title: task.title,
      area: task.area || "Sistema",
      severity: task.severity || "media",
      plain_explanation: task.plain_explanation || "",
      technical_detail: task.technical_detail || "",
      evidence: task.evidence || "",
      impact: task.impact || "",
      next_action: task.next_action || "",
      verify_hint: task.verify_hint || "",
      source: "Sualuma Launch Auditor",
      resolved: false,
      last_checked_at: now,
    });
  }

  const base = process.env.SUALUMA_BASE_URL || "https://sualuma.online";

  // 1. Servidor
  const pm2Raw = sh("pm2 jlist", 10000);
  try {
    const list = JSON.parse(pm2Raw || "[]");
    const bad = list.filter((p) => p.pm2_env && p.pm2_env.status !== "online");
    if (bad.length) {
      addTask({
        id: "pm2-processo-offline",
        title: "Existe processo PM2 fora do ar",
        area: "Servidor",
        severity: "alta",
        plain_explanation: "Alguma parte do sistema está cadastrada no PM2, mas não está rodando corretamente.",
        technical_detail: "PM2 encontrou processo com status diferente de online.",
        evidence: bad.map((p) => `${p.name}: ${p.pm2_env.status}`).join("\n"),
        impact: "Pode gerar página fora do ar, erro 502 ou parte do sistema sem resposta.",
        next_action: "Ver logs do processo e reiniciar somente o serviço afetado.",
        verify_hint: "O problema só será concluído quando todos os processos PM2 estiverem online.",
      });
    }
  } catch {}

  const nginxActive = sh("systemctl is-active nginx", 8000);
  if (nginxActive !== "active") {
    addTask({
      id: "nginx-inativo",
      title: "Nginx não está ativo",
      area: "Servidor",
      severity: "alta",
      plain_explanation: "O Nginx é a porta de entrada do site. Se ele parar, o domínio pode cair.",
      technical_detail: "systemctl is-active nginx não retornou active.",
      evidence: nginxActive,
      impact: "Site pode ficar fora do ar.",
      next_action: "Rodar nginx -t, corrigir erro e reiniciar Nginx.",
      verify_hint: "O problema será concluído quando o Nginx estiver active.",
    });
  }

  if (!exists(".next/BUILD_ID")) {
    addTask({
      id: "next-sem-build",
      title: "Build de produção do Next não foi encontrado",
      area: "Build",
      severity: "alta",
      plain_explanation: "O sistema precisa de uma versão montada para produção. Sem isso, o Next pode subir quebrado.",
      technical_detail: "Arquivo .next/BUILD_ID não existe.",
      evidence: "Não encontrei .next/BUILD_ID.",
      impact: "Pode causar erro 502 ou app sem carregar.",
      next_action: "Rodar npm run build e reiniciar o PM2.",
      verify_hint: "O problema será concluído quando existir .next/BUILD_ID.",
    });
  }

  // 2. Git
  const gitStatus = sh("git status --porcelain", 10000);
  if (gitStatus) {
    addTask({
      id: "git-alteracoes-pendentes",
      title: "Existem alterações pendentes no Git",
      area: "Código",
      severity: "media",
      plain_explanation: "Tem arquivos modificados no servidor que ainda não foram salvos oficialmente no histórico do projeto.",
      technical_detail: "git status --porcelain retornou arquivos alterados.",
      evidence: shortList(gitStatus, 20),
      impact: "Se você restaurar versão antiga ou mexer em outra branch, pode perder mudanças importantes.",
      next_action: "Revisar os arquivos, testar o sistema e salvar com commit quando estiver tudo certo.",
      verify_hint: "O problema será concluído quando git status estiver limpo.",
    });
  }

  // 3. Atualizações
  const updates = Number(sh("apt list --upgradable 2>/dev/null | tail -n +2 | wc -l", 20000)) || 0;
  if (updates > 0) {
    addTask({
      id: "servidor-atualizacoes-pendentes",
      title: `Servidor tem ${updates} atualizações pendentes`,
      area: "Segurança",
      severity: "media",
      plain_explanation: "O servidor tem pacotes esperando atualização. Isso pode incluir correções de segurança.",
      technical_detail: "apt list --upgradable encontrou pacotes pendentes.",
      evidence: `${updates} pacotes pendentes.`,
      impact: "Não é emergência se o sistema está estável, mas precisa entrar em uma janela segura de manutenção.",
      next_action: "Agendar atualização em horário seguro, fazer backup e reiniciar se necessário.",
      verify_hint: "O problema será concluído quando não houver pacotes pendentes.",
    });
  }

  // 4. Firewall
  const ufw = sh("ufw status", 10000);
  if (/inactive/i.test(ufw)) {
    addTask({
      id: "firewall-ufw-inativo",
      title: "Firewall UFW está inativo",
      area: "Segurança",
      severity: "media",
      plain_explanation: "O firewall ajuda a controlar quais portas ficam abertas no servidor.",
      technical_detail: "ufw status retornou inactive.",
      evidence: ufw,
      impact: "Não significa que o site foi invadido, mas deixa a segurança menos organizada.",
      next_action: "Depois que rotas, Nginx e SSL estiverem estáveis, planejar ativação segura do firewall.",
      verify_hint: "O problema será concluído quando o UFW estiver ativo com regras corretas.",
    });
  }

  // 5. NPM audit
  const auditRaw = sh("npm audit --json --omit=dev", 45000);
  try {
    const audit = JSON.parse(auditRaw || "{}");
    const vulns = audit.metadata?.vulnerabilities || {};
    const total = Number(vulns.total || 0);
    if (total > 0) {
      addTask({
        id: "npm-vulnerabilidades",
        title: `npm audit encontrou ${total} vulnerabilidade(s)`,
        area: "Segurança",
        severity: vulns.critical || vulns.high ? "alta" : "media",
        plain_explanation: "Alguma biblioteca usada pelo sistema tem alerta de segurança.",
        technical_detail: "npm audit --json --omit=dev encontrou vulnerabilidades.",
        evidence: JSON.stringify(vulns, null, 2),
        impact: "Precisa corrigir com cuidado, porque algumas correções automáticas podem quebrar o Next.",
        next_action: "Não rodar npm audit fix --force sem backup. Primeiro avaliar quais pacotes serão alterados.",
        verify_hint: "O problema será concluído quando npm audit não encontrar vulnerabilidades relevantes.",
      });
    }
  } catch {}

  // 6. Supabase
  const supabasePublicOk = envHas("NEXT_PUBLIC_SUPABASE_URL") && (envHas("NEXT_PUBLIC_SUPABASE_ANON_KEY") || envHas("SUPABASE_ANON_KEY"));
  if (!supabasePublicOk) {
    addTask({
      id: "supabase-env-publica-incompleta",
      title: "Configuração pública do Supabase parece incompleta",
      area: "Banco de dados",
      severity: "alta",
      plain_explanation: "O front precisa saber onde está o Supabase para login, cadastro e leitura permitida.",
      technical_detail: "Não encontrei NEXT_PUBLIC_SUPABASE_URL e chave anônima pública nos envs.",
      evidence: "Variáveis públicas do Supabase não encontradas ou incompletas.",
      impact: "Cadastro, login ou dados do painel podem falhar.",
      next_action: "Conferir .env e .env.local sem expor as chaves no navegador.",
      verify_hint: "O problema será concluído quando as variáveis públicas do Supabase existirem.",
    });
  }

  if (!envHas("SUPABASE_SERVICE_ROLE_KEY")) {
    addTask({
      id: "supabase-service-role-ausente",
      title: "Chave service role do Supabase não foi detectada no servidor",
      area: "Banco de dados",
      severity: "media",
      plain_explanation: "Algumas tarefas administrativas precisam de permissão de servidor, não de usuário comum.",
      technical_detail: "SUPABASE_SERVICE_ROLE_KEY não foi encontrada em .env ou .env.local.",
      evidence: "SUPABASE_SERVICE_ROLE_KEY ausente.",
      impact: "Gestão de usuários, sincronização e rotinas internas podem ficar limitadas.",
      next_action: "Conferir se o backend realmente precisa dessa chave e adicionar somente no servidor.",
      verify_hint: "O problema será concluído quando a chave existir no ambiente seguro do servidor.",
    });
  }

  // 7. Confirmação de e-mail
  const confirmCode = read("app/auth/confirm/route.ts") + read("app/auth/callback/route.ts") + read("app/auth/confirm/page.tsx");
  if (!confirmCode) {
    addTask({
      id: "auth-confirmacao-email-rota-ausente",
      title: "Não encontrei rota clara de confirmação de e-mail",
      area: "Usuários",
      severity: "alta",
      plain_explanation: "Quando o usuário clica no e-mail de confirmação, o sistema precisa receber esse clique e ativar a conta.",
      technical_detail: "Não encontrei arquivos em app/auth/confirm ou app/auth/callback suficientes.",
      evidence: "Arquivos de confirmação/callback não encontrados.",
      impact: "Usuário pode se cadastrar, mas não conseguir confirmar a conta.",
      next_action: "Criar ou revisar a rota de callback/confirm do Supabase Auth.",
      verify_hint: "O problema será concluído quando existir rota de confirmação funcionando.",
    });
  } else if (!/(verifyOtp|exchangeCodeForSession|getUser|auth\.confirm|auth\/callback)/i.test(confirmCode)) {
    addTask({
      id: "auth-confirmacao-email-fraca",
      title: "Rota de confirmação de e-mail existe, mas pode não estar validando sessão",
      area: "Usuários",
      severity: "alta",
      plain_explanation: "Parece existir uma página/rota de confirmação, mas não encontrei sinais fortes de validação real com Supabase.",
      technical_detail: "Não achei verifyOtp, exchangeCodeForSession ou getUser na confirmação.",
      evidence: "Rota existe, mas validação real não ficou clara no código.",
      impact: "O usuário pode clicar no e-mail e continuar sem confirmação efetiva.",
      next_action: "Revisar fluxo do Supabase Auth: callback, token, sessão e criação de perfil.",
      verify_hint: "O problema será concluído quando a rota validar o usuário de verdade.",
    });
  }

  // 8. Gestão de usuários
  const userManagementApi = existsAny([
    "app/api/studio/users/route.ts",
    "app/api/admin/users/route.ts",
    "app/api/platform/users/route.ts",
    "app/api/usuarios/route.ts",
  ]);

  if (!userManagementApi) {
    addTask({
      id: "gestao-usuarios-incompleta",
      title: "Gestão real de usuários ainda não foi detectada",
      area: "Usuários",
      severity: "alta",
      plain_explanation: "Para lançar, você precisa enxergar usuários, status de confirmação, plano, perfil e acesso.",
      technical_detail: "Não encontrei API clara de listagem/gestão de usuários.",
      evidence: "APIs procuradas: /api/studio/users, /api/admin/users, /api/platform/users, /api/usuarios.",
      impact: "Você pode vender e cadastrar usuários, mas não conseguir administrar quem entrou.",
      next_action: "Criar painel/API de usuários conectado ao Supabase Auth + tabela de perfis.",
      verify_hint: "O problema será concluído quando existir API/painel real de gestão de usuários.",
    });
  }

  // 9. Dashboard cliente
  const clientDash = await fetchInfo("https://dashboardcliente.sualuma.online");
  const clientLooksRedirectHome =
    [301, 302, 307, 308].includes(clientDash.status) &&
    (!clientDash.location || clientDash.location === "/" || /sualuma\.online\/?$/.test(clientDash.location));

  if (clientLooksRedirectHome) {
    addTask({
      id: "dashboard-cliente-redirecionando-home",
      title: "Dashboard do cliente parece redirecionar para a Home",
      area: "Dashboard Cliente",
      severity: "alta",
      plain_explanation: "O cliente tenta entrar na área dele, mas o sistema manda para a página inicial.",
      technical_detail: "Teste do subdomínio dashboardcliente.sualuma.online retornou redirect para Home.",
      evidence: `Status: ${clientDash.status}\nLocation: ${clientDash.location || "(sem location)"}`,
      impact: "Cliente não consegue usar a área contratada após login.",
      next_action: "Revisar Nginx do subdomínio, middleware de autenticação e rota do dashboard do cliente.",
      verify_hint: "O problema será concluído quando o subdomínio abrir o dashboard ou redirecionar corretamente para login/dashboard.",
    });
  }

  if (!existsAny(["app/cliente/dashboard/page.tsx", "app/dashboard-cliente/page.tsx", "app/member-services/page.tsx", "app/member-user/page.tsx"])) {
    addTask({
      id: "dashboard-cliente-pagina-nao-detectada",
      title: "Não encontrei página clara do dashboard do cliente",
      area: "Dashboard Cliente",
      severity: "alta",
      plain_explanation: "Existe API de cliente, mas não encontrei uma página óbvia para o cliente usar.",
      technical_detail: "Procurei rotas de dashboard do cliente no app.",
      evidence: "Rotas esperadas não detectadas.",
      impact: "Pode explicar por que o dashboard cai na Home ou fica confuso.",
      next_action: "Definir a rota oficial do dashboard do cliente e conectar o subdomínio a ela.",
      verify_hint: "O problema será concluído quando a rota oficial existir e responder corretamente.",
    });
  }

  // 10. APIs importantes
  const apiChecks = [
    ["/api/studio/dashboard", "API do Studio principal"],
    ["/api/studio/mia-brain", "API da Mia Brain"],
    ["/api/cliente/dashboard", "API do Dashboard Cliente"],
    ["/api/prestador/dashboard", "API do Dashboard Prestador"],
  ];

  for (const [url, label] of apiChecks) {
    const r = await fetchInfo(base + url);
    if (r.status === 404 || r.status >= 500 || r.status === 0) {
      addTask({
        id: `api-falha-${url.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
        title: `${label} não respondeu corretamente`,
        area: "APIs",
        severity: "alta",
        plain_explanation: "Uma parte visual do sistema pode estar sem dados reais porque a API por trás dela falhou.",
        technical_detail: `${url} retornou status ${r.status}.`,
        evidence: `URL: ${base + url}\nStatus: ${r.status}\nResposta: ${r.body}`,
        impact: "Painéis podem aparecer vazios, com dados falsos ou quebrados.",
        next_action: "Abrir a rota da API, verificar logs e conexão com banco.",
        verify_hint: "O problema será concluído quando a API retornar 200 ou erro controlado esperado.",
      });
    }
  }

  // 11. Studio com dados fixos
  const studioCode = read("app/studio-lab/page.tsx");
  const mockTokens = [
    "const empireHealth = [",
    "const sitemapItems = [",
    "const agents = [",
    "const serviceSignals = [",
    "const communitySignals = [",
    "const users = [",
    "const notifications = [",
    "const financeMiaRows = [",
    "const miaOrganicRows = [",
  ];
  const mocks = mockTokens.filter((token) => studioCode.includes(token));

  if (mocks.length >= 3) {
    addTask({
      id: "studio-principal-com-dados-fixos",
      title: "Studio principal ainda usa muitos dados fixos",
      area: "Studio",
      severity: "alta",
      plain_explanation: "O painel visual parece bonito, mas várias partes ainda podem estar mostrando exemplos escritos no código, não dados reais do banco.",
      technical_detail: "Detectei arrays fixos dentro de app/studio-lab/page.tsx.",
      evidence: mocks.join("\n"),
      impact: "Você pode achar que está vendo a saúde real do sistema, mas parte do painel pode ser só visual.",
      next_action: "Trocar cada bloco fixo por dados vindos de APIs conectadas ao Supabase/Postgres.",
      verify_hint: "O problema será concluído quando os blocos principais consumirem APIs reais.",
    });
  }

  // 12. Stripe
  const stripeHasSecret = envHas("STRIPE_SECRET_KEY");
  const stripeWebhookExists = existsAny(["app/api/stripe/webhook/route.ts", "app/api/stripe/webhooks/route.ts"]);
  if (stripeHasSecret && !stripeWebhookExists) {
    addTask({
      id: "stripe-webhook-ausente",
      title: "Stripe tem chave, mas não encontrei webhook",
      area: "Pagamentos",
      severity: "alta",
      plain_explanation: "O checkout pode vender, mas o sistema precisa receber aviso da Stripe para liberar plano/acesso.",
      technical_detail: "STRIPE_SECRET_KEY existe, mas webhook não foi encontrado.",
      evidence: "Não encontrei app/api/stripe/webhook/route.ts.",
      impact: "Usuário pode pagar e o sistema não atualizar o plano automaticamente.",
      next_action: "Criar webhook da Stripe para checkout.session.completed e atualizar usuário/plano.",
      verify_hint: "O problema será concluído quando existir webhook e ele estiver conectado à Stripe.",
    });
  }

  // 13. Rotas privadas possivelmente públicas
  const privatePages = ["/member-user", "/member-services", "/provider-services"];
  for (const p of privatePages) {
    const r = await fetchInfo(base + p);
    if (r.status === 200 && !/login|entrar|sign-in|auth/i.test(r.body)) {
      addTask({
        id: `rota-privada-revisar-${p.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
        title: `Revisar proteção da rota ${p}`,
        area: "Segurança",
        severity: "media",
        plain_explanation: "Essa página parece abrir sem login. Pode ser só uma tela pública, mas precisa confirmar.",
        technical_detail: `${p} retornou 200 sem redirecionamento claro para login.`,
        evidence: `URL: ${base + p}\nStatus: ${r.status}`,
        impact: "Se for área privada, dados internos podem ficar expostos.",
        next_action: "Confirmar se essa página deve ser pública. Se não, proteger com middleware/auth.",
        verify_hint: "O problema será concluído quando a rota privada bloquear usuário sem login.",
      });
    }
  }

  const activeIds = new Set(issues.map((t) => t.id));
  const merged = [];

  for (const task of issues) {
    const oldTask = oldMap.get(task.id);
    let status = oldTask?.status || "todo";

    if (oldTask?.resolved === true || oldTask?.status === "validated") {
      status = "todo";
    }

    merged.push({
      ...task,
      status,
      created_at: oldTask?.created_at || now,
      updated_at: now,
      verification_message: oldTask?.verification_message || "",
    });
  }

  for (const oldTask of old.tasks || []) {
    if (!activeIds.has(oldTask.id)) {
      merged.push({
        ...oldTask,
        resolved: true,
        status: "validated",
        updated_at: now,
        last_checked_at: now,
        verification_message: "Validei de novo e não encontrei mais esse problema no sistema.",
      });
    }
  }

  const openTasks = merged.filter((t) => t.status !== "validated");
  const high = openTasks.filter((t) => t.severity === "alta").length;
  const medium = openTasks.filter((t) => t.severity === "media").length;
  const low = openTasks.filter((t) => t.severity === "baixa").length;

  const penalty = openTasks.reduce((sum, t) => sum + severityWeight(t.severity), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  sections.push({
    title: "Resumo leigo",
    lines: [
      openTasks.length === 0
        ? "Não encontrei bloqueios ativos neste ciclo."
        : `Encontrei ${openTasks.length} ponto(s) que precisam de atenção antes do lançamento.`,
      high > 0
        ? `${high} item(ns) são graves porque podem impedir cadastro, acesso, pagamento, segurança ou uso real.`
        : "Nenhum bloqueio grave ativo neste ciclo.",
      "As tarefas abaixo explicam o problema em português simples e mostram a prova que encontrei.",
    ],
  });

  sections.push({
    title: "Como usar",
    lines: [
      "1. Leia a explicação leiga da tarefa.",
      "2. Corrija no código, banco, Supabase, Stripe ou Nginx.",
      "3. Marque como finalizado.",
      "4. Clique em verificar.",
      "5. O copiloto roda a auditoria de novo: se resolveu, valida; se não resolveu, volta para andamento.",
    ],
  });

  const report = {
    ok: true,
    name: "Sualuma Launch Auditor",
    generated_at: now,
    score,
    summary:
      openTasks.length === 0
        ? "Sistema sem bloqueios principais detectados neste ciclo."
        : "Sistema funcionando, mas ainda existem pontos importantes antes do lançamento.",
    counts: {
      total: merged.length,
      open: openTasks.length,
      high,
      medium,
      low,
      validated: merged.filter((t) => t.status === "validated").length,
    },
    sections,
    tasks: merged,
  };

  writeJson(REPORT, report);

  const latestTxt = path.join(REPORT_DIR, "launch-auditor-latest.txt");
  fs.writeFileSync(
    latestTxt,
    [
      "SUALUMA LAUNCH AUDITOR",
      `Data: ${now}`,
      `Score: ${score}/100`,
      `Tarefas abertas: ${openTasks.length}`,
      "",
      ...openTasks.map((t, i) => `${i + 1}. [${t.severity}] ${t.title}\n${t.plain_explanation}\nAção: ${t.next_action}\n`),
    ].join("\n")
  );

  console.log(`✅ Auditoria gerada: ${REPORT}`);
  console.log(`Score: ${score}/100`);
  console.log(`Tarefas abertas: ${openTasks.length}`);
}

main().catch((e) => {
  console.error("Erro no Launch Auditor:", e);
  process.exit(1);
});
