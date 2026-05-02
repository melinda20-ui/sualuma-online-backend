import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "warn" | "danger" | "info";

type Check = {
  title: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
};

function mask(value?: string | null) {
  if (!value) return null;
  if (value.length <= 12) return "***";
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function exists(filePath: string) {
  try {
    return fs.existsSync(path.join(process.cwd(), filePath));
  } catch {
    return false;
  }
}

function readSafe(filePath: string) {
  try {
    const full = path.join(process.cwd(), filePath);
    if (!fs.existsSync(full)) return "";
    return fs.readFileSync(full, "utf8");
  } catch {
    return "";
  }
}

function readAbsoluteSafe(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function hasAny(content: string, terms: string[]) {
  return terms.some((term) => content.includes(term));
}

function getNginxContent() {
  const dirs = [
    "/etc/nginx/sites-enabled",
    "/etc/nginx/sites-available",
    "/etc/nginx/conf.d",
  ];

  let output = "";

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);

      for (const file of files) {
        const full = path.join(dir, file);
        try {
          const stat = fs.statSync(full);
          if (!stat.isFile() && !stat.isSymbolicLink()) continue;

          const content = fs.readFileSync(full, "utf8");

          if (
            content.includes("sualuma.online") ||
            content.includes("dashboardcliente") ||
            content.includes("meuservico")
          ) {
            output += `\n\n# FILE: ${full}\n${content}`;
          }
        } catch {}
      }
    } catch {}
  }

  return output;
}

function extractServerNames(nginx: string) {
  const matches = [...nginx.matchAll(/server_name\s+([^;]+);/g)];
  return Array.from(
    new Set(
      matches
        .flatMap((match) => match[1].trim().split(/\s+/))
        .filter(Boolean)
    )
  ).sort();
}

export async function GET() {
  const checks: Check[] = [];

  const envInfo = {
    NEXT_PUBLIC_SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_URL: mask(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
    SITE_URL: process.env.SITE_URL || null,
    APP_URL: process.env.APP_URL || null,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE
    ),
  };

  const files = {
    middleware: exists("middleware.ts"),
    supabaseServer: exists("lib/supabase/server.ts"),
    supabaseClient: exists("lib/supabase/client.ts"),
    authCallback: exists("app/auth/callback/route.ts"),
    authConfirm: exists("app/auth/confirm/route.ts"),
    loginPage: exists("app/login/page.tsx") || exists("app/entrar/page.tsx"),
    signInPage: exists("app/sign-in/[[...sign-in]]/page.tsx"),
    userSettingsApi: exists("app/api/usuario/configuracoes/route.ts"),
    userPackageAccessScript: exists("scripts/create-fake-users.mjs"),
  };

  const middleware = readSafe("middleware.ts");
  const supabaseServer = readSafe("lib/supabase/server.ts");
  const supabaseClient = readSafe("lib/supabase/client.ts");
  const authCallback = readSafe("app/auth/callback/route.ts");
  const authConfirm = readSafe("app/auth/confirm/route.ts");
  const loginPage =
    readSafe("app/login/page.tsx") ||
    readSafe("app/entrar/page.tsx") ||
    readSafe("app/auth/page.tsx");

  const nginx = getNginxContent();
  const serverNames = extractServerNames(nginx);

  const packageApi = readSafe("app/api/auth/access/route.ts");

  checks.push({
    title: "Subdomínios encontrados no Nginx",
    status: serverNames.length ? "ok" : "warn",
    detail: serverNames.length
      ? `Encontrados: ${serverNames.join(", ")}`
      : "Não consegui identificar server_name do Nginx.",
    fix: "Confirmar se todos os subdomínios usados no produto existem no DNS e apontam para a VPS.",
  });

  checks.push({
    title: "Login entre subdomínios",
    status: "danger",
    detail:
      "O navegador trata sualuma.online, dashboardcliente.sualuma.online e meuservico.sualuma.online como origens diferentes. Se a sessão estiver em localStorage ou cookie sem domínio .sualuma.online, o login não acompanha a troca de subdomínio.",
    fix:
      "Centralizar autenticação ou configurar sessão/cookies para domínio compartilhado .sualuma.online. Outra opção é manter os dashboards como rotas do mesmo domínio principal.",
  });

  checks.push({
    title: "Rota de callback de autenticação",
    status: files.authCallback ? "ok" : "danger",
    detail: files.authCallback
      ? "Existe app/auth/callback/route.ts."
      : "Não encontrei app/auth/callback/route.ts.",
    fix:
      "Garantir que o Supabase esteja redirecionando confirmação/login para uma rota existente, como https://sualuma.online/auth/callback.",
  });

  checks.push({
    title: "Rota de confirmação de e-mail",
    status: files.authConfirm ? "ok" : "warn",
    detail: files.authConfirm
      ? "Existe app/auth/confirm/route.ts."
      : "Não encontrei app/auth/confirm/route.ts.",
    fix:
      "Se o e-mail confirma mas depois o sistema diz que não confirmou, precisamos revisar essa rota e as URLs autorizadas no Supabase Auth.",
  });

  checks.push({
    title: "Middleware de proteção de rotas",
    status: files.middleware ? "ok" : "warn",
    detail: files.middleware
      ? "Existe middleware.ts."
      : "Não encontrei middleware.ts.",
    fix:
      "Revisar se o middleware lê a sessão corretamente e se não está redirecionando usuários confirmados para login por engano.",
  });

  checks.push({
    title: "Cliente Supabase no servidor",
    status: files.supabaseServer ? "ok" : "danger",
    detail: files.supabaseServer
      ? "Existe lib/supabase/server.ts."
      : "Não encontrei lib/supabase/server.ts.",
    fix:
      "A área protegida precisa consultar o usuário no servidor com cookies/sessão corretos.",
  });

  checks.push({
    title: "Cliente Supabase no navegador",
    status: files.supabaseClient ? "ok" : "warn",
    detail: files.supabaseClient
      ? "Existe lib/supabase/client.ts."
      : "Não encontrei lib/supabase/client.ts.",
    fix:
      "Se o login usa Supabase no navegador, precisamos verificar se a sessão está indo para localStorage por subdomínio.",
  });

  const usesSignInWithPassword = hasAny(loginPage, [
    "signInWithPassword",
    "signInWithOAuth",
    "auth.signIn",
  ]);

  checks.push({
    title: "Página de login",
    status: usesSignInWithPassword ? "ok" : "warn",
    detail: usesSignInWithPassword
      ? "Encontrei uso de autenticação Supabase/cliente na página de login."
      : "Não encontrei claramente signInWithPassword/signInWithOAuth na página de login.",
    fix:
      "Revisar se o botão de login não dispara múltiplas tentativas e se o erro de rate limit está sendo tratado corretamente.",
  });

  const hasCaptcha = hasAny(loginPage, ["recaptcha", "captcha", "turnstile"]);

  checks.push({
    title: "Captcha no login",
    status: hasCaptcha ? "info" : "warn",
    detail: hasCaptcha
      ? "Encontrei referência a captcha/reCAPTCHA no login."
      : "Não encontrei referência clara a captcha no login.",
    fix:
      "Como apareceu 'Request rate limit reached', precisamos limitar cliques repetidos e conferir a configuração do captcha no Supabase/provedor.",
  });

  checks.push({
    title: "Variáveis de ambiente do Supabase",
    status:
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "ok"
        : "danger",
    detail: `URL Supabase: ${
      envInfo.NEXT_PUBLIC_SUPABASE_URL || envInfo.SUPABASE_URL || "não encontrada"
    }. Anon key: ${envInfo.hasAnonKey ? "encontrada" : "não encontrada"}. Service role: ${
      envInfo.hasServiceRoleKey ? "encontrada" : "não encontrada"
    }.`,
    fix:
      "Garantir NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env. A service role fica só no servidor, nunca no navegador.",
  });

  checks.push({
    title: "URLs públicas do app",
    status:
      envInfo.NEXT_PUBLIC_SITE_URL ||
      envInfo.SITE_URL ||
      envInfo.APP_URL ||
      envInfo.NEXT_PUBLIC_APP_URL
        ? "ok"
        : "warn",
    detail: `NEXT_PUBLIC_SITE_URL=${envInfo.NEXT_PUBLIC_SITE_URL || "vazio"}, SITE_URL=${
      envInfo.SITE_URL || "vazio"
    }, APP_URL=${envInfo.APP_URL || "vazio"}, NEXT_PUBLIC_APP_URL=${
      envInfo.NEXT_PUBLIC_APP_URL || "vazio"
    }.`,
    fix:
      "Padronizar a URL principal usada em callbacks. Exemplo: https://sualuma.online ou uma URL central de login.",
  });

  checks.push({
    title: "Tabela de configurações do usuário",
    status: files.userSettingsApi ? "ok" : "warn",
    detail: files.userSettingsApi
      ? "API /api/usuario/configuracoes existe."
      : "API /api/usuario/configuracoes não encontrada.",
    fix:
      "Confirmar que a tabela public.user_settings foi criada no Supabase.",
  });

  checks.push({
    title: "Controle de pacotes IA/Serviços",
    status: packageApi ? "ok" : "warn",
    detail: packageApi
      ? "Existe API de acesso por pacote."
      : "Ainda não encontrei /api/auth/access. A tabela user_package_access pode existir, mas falta a portaria no código.",
    fix:
      "Criar uma API que verifica se o usuário tem ia_client, services_client ou ambos antes de liberar dashboard.",
  });

  const callbackMentionsDomains = hasAny(authCallback + authConfirm + middleware, [
    "dashboardcliente.sualuma.online",
    "meuservico.sualuma.online",
    "sualuma.online",
  ]);

  checks.push({
    title: "Callbacks mencionam domínios do produto",
    status: callbackMentionsDomains ? "ok" : "warn",
    detail: callbackMentionsDomains
      ? "Algumas rotas mencionam domínios do produto."
      : "Não encontrei menção clara aos domínios nos callbacks/middleware.",
    fix:
      "Revisar Supabase Auth > URL Configuration: Site URL e Redirect URLs precisam incluir os domínios/rotas corretas.",
  });

  const checklist = [
    {
      group: "Confirmação de e-mail",
      items: [
        "Conferir Supabase Auth > URL Configuration > Site URL.",
        "Conferir Supabase Auth > Redirect URLs autorizadas.",
        "Testar link de confirmação e verificar se app/auth/confirm recebe token corretamente.",
        "Garantir que após confirmar o e-mail o usuário fica com email_confirmed_at preenchido.",
      ],
    },
    {
      group: "Sessão entre subdomínios",
      items: [
        "Decidir domínio central de login: sualuma.online/login ou auth.sualuma.online.",
        "Padronizar callbacks para voltar sempre pelo domínio central.",
        "Configurar sessão/cookie para .sualuma.online ou criar fluxo SSO interno.",
        "Testar login em dashboardcliente e navegação para meuservico sem perder sessão.",
      ],
    },
    {
      group: "Portaria de pacotes",
      items: [
        "Criar/validar tabela public.user_package_access.",
        "Criar API /api/auth/access para retornar ia_client e services_client.",
        "Proteger Dashboard Cliente IA: sem ia_client ativo manda para planos de IA.",
        "Proteger Meu Serviço: sem services_client ativo manda para planos de serviços.",
        "Usuário com pacote completo deve acessar os dois dashboards.",
      ],
    },
    {
      group: "Rate limit e captcha",
      items: [
        "Evitar múltiplos cliques no botão Entrar.",
        "Mostrar mensagem amigável quando bater rate limit.",
        "Conferir se reCAPTCHA está configurado no domínio certo.",
        "Criar modo de teste interno para usuários fake sem ficar travando login real.",
      ],
    },
    {
      group: "Experiência do usuário",
      items: [
        "Depois de confirmar e-mail, enviar para página clara de sucesso.",
        "Se usuário tentar dashboard sem pacote, mostrar tela de upgrade, não erro.",
        "Criar botão de alternância entre Dashboard IA e Meu Serviço.",
        "Mostrar no perfil quais pacotes o usuário possui.",
      ],
    },
  ];

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    envInfo,
    files,
    serverNames,
    checks,
    checklist,
  });
}
