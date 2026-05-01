#!/usr/bin/env bash
set +e

cd /root/luma-os || exit 1

TS="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="/root/luma-os/reports/copilot"
REPORT="$REPORT_DIR/copilot-$TS.txt"
LATEST="$REPORT_DIR/latest.txt"

mkdir -p "$REPORT_DIR"

exec > >(tee "$REPORT") 2>&1

echo "=================================================="
echo "🤖 SUALUMA COPILOT LOCAL"
echo "Monitoramento gratuito do sistema"
echo "Data: $(date)"
echo "Servidor: $(hostname)"
echo "=================================================="

ALERTS=0

alert() {
  echo "⚠️ $1"
  ALERTS=$((ALERTS+1))
}

ok() {
  echo "✅ $1"
}

echo ""
echo "=================================================="
echo "1) SISTEMA"
echo "=================================================="
uptime
free -h
df -h /

if [ -f /var/run/reboot-required ]; then
  alert "Servidor pede reboot programado."
else
  ok "Sem reboot obrigatório."
fi

UPDATES="$(apt list --upgradable 2>/dev/null | grep -vc '^Listing' || true)"
echo "Updates disponíveis: $UPDATES"
if [ "$UPDATES" -gt 0 ]; then
  alert "Existem atualizações pendentes."
fi

echo ""
echo "=================================================="
echo "2) PROCESSOS PM2"
echo "=================================================="
pm2 status

pm2 jlist 2>/dev/null | grep -q '"status":"online"' && ok "PM2 tem processos online." || alert "PM2 pode estar com processo offline."

echo ""
echo "=================================================="
echo "3) NGINX / APACHE"
echo "=================================================="

NGINX_ACTIVE="$(systemctl is-active nginx 2>/dev/null)"
NGINX_ENABLED="$(systemctl is-enabled nginx 2>/dev/null)"
APACHE_ACTIVE="$(systemctl is-active apache2 2>/dev/null || true)"
APACHE_ENABLED="$(systemctl is-enabled apache2 2>/dev/null || true)"

echo "Nginx ativo: $NGINX_ACTIVE"
echo "Nginx enabled: $NGINX_ENABLED"
echo "Apache ativo: $APACHE_ACTIVE"
echo "Apache enabled/masked: $APACHE_ENABLED"

[ "$NGINX_ACTIVE" = "active" ] && ok "Nginx ativo." || alert "Nginx não está ativo."
[ "$APACHE_ACTIVE" = "inactive" ] || [ "$APACHE_ACTIVE" = "unknown" ] && ok "Apache não está rodando." || alert "Apache está ativo e pode roubar porta 80."

nginx -t && ok "Configuração do Nginx válida." || alert "Nginx tem erro de configuração."

echo ""
echo "=================================================="
echo "4) PORTAS IMPORTANTES"
echo "=================================================="
ss -tulpn | grep -E ':80|:443|:3000|:11434' || alert "Portas importantes não apareceram."

echo ""
echo "=================================================="
echo "5) ROTAS PRINCIPAIS"
echo "=================================================="

check_url() {
  NAME="$1"
  URL="$2"
  CODE="$(curl -k -L -s -o /dev/null -w "%{http_code}" --max-time 12 "$URL")"
  if [ "$CODE" = "200" ] || [ "$CODE" = "307" ] || [ "$CODE" = "308" ]; then
    ok "$NAME -> $CODE -> $URL"
  else
    alert "$NAME retornou $CODE -> $URL"
  fi
}

check_url "Home" "https://sualuma.online"
check_url "Login" "https://sualuma.online/login"
check_url "Planos" "https://sualuma.online/planos"
check_url "Marketplace" "https://sualuma.online/marketplace"
check_url "Chat novo" "https://sualuma.online/chat"
check_url "Chat antigo" "https://sualuma.online/chat-antigo"
check_url "Studio" "https://sualuma.online/studio"
check_url "Mia Brain" "https://sualuma.online/studio/mia-brain"
check_url "Serviços e Indique" "https://sualuma.online/studio/servicos-e-indique"
check_url "API Mia Brain" "https://sualuma.online/api/studio/mia-brain"
check_url "API Chat Antigo Brain" "https://sualuma.online/api/chat-antigo/brain"

echo ""
echo "=================================================="
echo "6) BANCO / MIA BRAIN"
echo "=================================================="

API_MIA="$(curl -k -s --max-time 12 https://sualuma.online/api/studio/mia-brain)"
echo "$API_MIA" | head -c 1200
echo ""

echo "$API_MIA" | grep -q '"ok":true' && ok "Mia Brain conectada." || alert "Mia Brain não respondeu ok."

echo ""
echo "=================================================="
echo "7) GIT"
echo "=================================================="

git status --short

if [ -n "$(git status --short)" ]; then
  alert "Existem alterações pendentes no Git."
else
  ok "Git limpo."
fi

echo ""
echo "Últimos commits:"
git log --oneline -n 8

echo ""
echo "=================================================="
echo "8) BUILD / NEXT"
echo "=================================================="

if [ -f ".next/BUILD_ID" ]; then
  ok "Existe build de produção."
  echo "BUILD_ID: $(cat .next/BUILD_ID 2>/dev/null)"
else
  alert "Não encontrei .next/BUILD_ID. Pode faltar build."
fi

echo ""
echo "Teste local Next:"
curl -I --max-time 10 http://127.0.0.1:3000 || alert "Next local não respondeu."

echo ""
echo "=================================================="
echo "9) LOGS RECENTES"
echo "=================================================="

echo ""
echo "Erros recentes luma-os:"
pm2 logs luma-os --lines 80 --nostream 2>/dev/null | grep -Ei "error|failed|502|timeout|invariant|production build|cannot|refused" | tail -40 || true

echo ""
echo "Erros recentes Nginx:"
tail -80 /var/log/nginx/error.log 2>/dev/null | tail -40 || true

echo ""
echo "=================================================="
echo "10) SEGURANÇA BÁSICA"
echo "=================================================="

echo "UFW:"
ufw status 2>/dev/null || echo "UFW não disponível."

echo ""
echo "Últimas atualizações automáticas:"
tail -40 /var/log/unattended-upgrades/unattended-upgrades.log 2>/dev/null || true

echo ""
echo "Pacotes vulneráveis via npm audit resumido:"
timeout 45 npm audit --omit=dev --audit-level=moderate 2>/dev/null | sed -n '1,80p' || echo "npm audit não rodou ou encontrou alertas."

echo ""
echo "=================================================="
echo "11) SUGESTÕES DO COPILOTO"
echo "=================================================="

if [ "$UPDATES" -gt 0 ]; then
  echo "- Programar atualização do servidor em horário seguro."
fi

if [ -f /var/run/reboot-required ]; then
  echo "- Programar reboot com cuidado: salvar PM2 antes, reiniciar, conferir Nginx/PM2 depois."
fi

if [ "$APACHE_ACTIVE" != "inactive" ] && [ "$APACHE_ACTIVE" != "unknown" ]; then
  echo "- Apache está ativo. Desligar/bloquear para não derrubar Nginx."
fi

if [ -n "$(git status --short)" ]; then
  echo "- Revisar alterações pendentes no Git antes de lançar."
fi

echo "- Antes de lançamento oficial: testar cadastro, login, pagamento Stripe, e-mail, WhatsApp, LGPD e páginas de erro."
echo "- Próximo nível: conectar este relatório ao OpenCode somente quando ALERTAS > 0."

echo ""
echo "=================================================="
echo "RESULTADO FINAL"
echo "=================================================="

if [ "$ALERTS" -eq 0 ]; then
  echo "✅ Sistema sem alertas críticos no diagnóstico local."
else
  echo "⚠️ Total de alertas encontrados: $ALERTS"
fi

cp "$REPORT" "$LATEST"

echo ""
echo "Relatório salvo em:"
echo "$REPORT"
echo ""
echo "Último relatório sempre aqui:"
echo "$LATEST"
