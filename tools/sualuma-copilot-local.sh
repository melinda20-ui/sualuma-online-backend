#!/usr/bin/env bash
set +e

cd /root/luma-os || exit 1

TS="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="/root/luma-os/reports/copilot"
REPORT="$REPORT_DIR/copilot-$TS.txt"
LATEST="$REPORT_DIR/latest.txt"
JSON="$REPORT_DIR/latest.json"

mkdir -p "$REPORT_DIR"

SUGGESTIONS_FILE="$(mktemp)"
CHECKS_FILE="$(mktemp)"

ALERTS=0
CRITICALS=0

add_check() {
  echo "$1|$2|$3" >> "$CHECKS_FILE"
}

suggest() {
  echo "$1" >> "$SUGGESTIONS_FILE"
}

warn() {
  ALERTS=$((ALERTS+1))
  suggest "⚠️ $1"
}

crit() {
  ALERTS=$((ALERTS+1))
  CRITICALS=$((CRITICALS+1))
  suggest "🚨 $1"
}

exec > >(tee "$REPORT") 2>&1

echo "=================================================="
echo "🤖 SUALUMA COPILOT INTELIGENTE"
echo "Monitoramento do sistema, segurança, performance e lançamento"
echo "Data: $(date)"
echo "Servidor: $(hostname)"
echo "=================================================="

echo ""
echo "=================================================="
echo "1) SISTEMA"
echo "=================================================="
uptime
free -h
df -h /

DISK_PCT="$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')"
MEM_AVAIL_MB="$(free -m | awk '/Mem:/ {print $7}')"

if [ "$DISK_PCT" -ge 90 ]; then
  crit "Disco acima de 90%. Risco de travar build, logs e banco local."
  add_check "Disco" "critical" "Uso atual: ${DISK_PCT}%"
elif [ "$DISK_PCT" -ge 80 ]; then
  warn "Disco acima de 80%. Programar limpeza de backups/logs antigos."
  add_check "Disco" "attention" "Uso atual: ${DISK_PCT}%"
else
  add_check "Disco" "ok" "Uso atual: ${DISK_PCT}%"
fi

if [ "$MEM_AVAIL_MB" -lt 700 ]; then
  warn "Memória disponível baixa. Pode deixar build e IA mais lentos."
  add_check "Memória" "attention" "Disponível: ${MEM_AVAIL_MB}MB"
else
  add_check "Memória" "ok" "Disponível: ${MEM_AVAIL_MB}MB"
fi

if [ -f /var/run/reboot-required ]; then
  warn "Servidor pede reboot programado. Fazer em horário seguro."
  add_check "Reboot" "attention" "Reboot pendente"
else
  echo "✅ Sem reboot obrigatório."
  add_check "Reboot" "ok" "Sem reboot obrigatório"
fi

UPDATES="$(apt list --upgradable 2>/dev/null | grep -v "Listing" | wc -l | tr -d ' ')"
echo "Updates disponíveis: $UPDATES"

if [ "$UPDATES" -gt 0 ]; then
  warn "Existem $UPDATES atualizações pendentes. Atualizar em janela segura."
  add_check "Atualizações" "attention" "$UPDATES updates pendentes"
else
  add_check "Atualizações" "ok" "Sistema sem updates pendentes"
fi

echo ""
echo "=================================================="
echo "2) PM2"
echo "=================================================="
PM2_TEXT="$(pm2 status 2>&1)"
echo "$PM2_TEXT"

if echo "$PM2_TEXT" | grep -Eiq "errored|stopped|offline"; then
  crit "Existe processo PM2 parado ou com erro."
  add_check "PM2" "critical" "Processo com erro/parado"
else
  echo "✅ PM2 online."
  add_check "PM2" "ok" "Processos principais online"
fi

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

if [ "$NGINX_ACTIVE" != "active" ]; then
  crit "Nginx não está ativo. O site pode cair no domínio."
  add_check "Nginx" "critical" "Nginx não ativo"
else
  add_check "Nginx" "ok" "Nginx ativo"
fi

if [ "$APACHE_ACTIVE" = "active" ]; then
  crit "Apache está ativo e pode roubar as portas 80/443 do Nginx."
  add_check "Apache" "critical" "Apache ativo"
else
  add_check "Apache" "ok" "Apache inativo/masked"
fi

nginx -t
if [ "$?" -ne 0 ]; then
  crit "Configuração do Nginx com erro."
else
  add_check "Nginx config" "ok" "Configuração válida"
fi

echo ""
echo "=================================================="
echo "4) PORTAS IMPORTANTES"
echo "=================================================="
ss -tulpn | grep -E ':80|:443|:3000|:11434' || true

if ! ss -tulpn | grep -q ':3000'; then
  crit "Porta 3000 não está aberta. Next/luma-os pode estar fora."
fi

if ! ss -tulpn | grep ':80' | grep -q nginx; then
  warn "Porta 80 não parece estar com Nginx."
fi

if ! ss -tulpn | grep ':443' | grep -q nginx; then
  warn "Porta 443 não parece estar com Nginx."
fi

echo ""
echo "=================================================="
echo "5) ROTAS PRINCIPAIS"
echo "=================================================="

ROUTES=(
  "Home|https://sualuma.online"
  "Login|https://sualuma.online/login"
  "Planos|https://sualuma.online/planos"
  "Marketplace|https://sualuma.online/marketplace"
  "Chat novo|https://sualuma.online/chat"
  "Chat antigo|https://sualuma.online/chat-antigo"
  "Studio|https://sualuma.online/studio"
  "Mia Brain|https://sualuma.online/studio/mia-brain"
  "Serviços e Indique|https://sualuma.online/studio/servicos-e-indique"
  "API Mia Brain|https://sualuma.online/api/studio/mia-brain"
  "API Chat Antigo Brain|https://sualuma.online/api/chat-antigo/brain"
)

for item in "${ROUTES[@]}"; do
  NAME="${item%%|*}"
  URL="${item#*|}"
  CODE="$(curl -k -L -s -o /dev/null -w "%{http_code}" --max-time 15 "$URL")"

  if [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "302" ] || [ "$CODE" = "307" ] || [ "$CODE" = "308" ]; then
    echo "✅ $NAME -> $CODE -> $URL"
    add_check "$NAME" "ok" "HTTP $CODE"
  else
    echo "❌ $NAME -> $CODE -> $URL"
    crit "Rota $NAME respondeu HTTP $CODE."
    add_check "$NAME" "critical" "HTTP $CODE"
  fi
done

echo ""
echo "=================================================="
echo "6) BANCO / MIA BRAIN"
echo "=================================================="
MIA_JSON="$(curl -k -s --max-time 15 https://sualuma.online/api/studio/mia-brain)"
echo "$MIA_JSON" | head -c 1200
echo ""

if echo "$MIA_JSON" | grep -q '"ok":true'; then
  echo "✅ Mia Brain conectada."
  add_check "Mia Brain" "ok" "Banco/API conectados"
else
  warn "Mia Brain não retornou ok:true."
  add_check "Mia Brain" "attention" "Resposta sem ok:true"
fi

echo ""
echo "=================================================="
echo "7) GIT"
echo "=================================================="
GIT_STATUS="$(git status --short)"
if [ -z "$GIT_STATUS" ]; then
  echo "✅ Git limpo."
  add_check "Git" "ok" "Sem alterações pendentes"
else
  echo "$GIT_STATUS"
  warn "Existem alterações pendentes no Git. Revisar antes de lançar."
  add_check "Git" "attention" "Alterações pendentes"
fi

git log --oneline -n 8

echo ""
echo "=================================================="
echo "8) BUILD / NEXT"
echo "=================================================="
if [ -f .next/BUILD_ID ]; then
  BUILD_ID="$(cat .next/BUILD_ID)"
  echo "✅ Existe build de produção."
  echo "BUILD_ID: $BUILD_ID"
  add_check "Build Next" "ok" "BUILD_ID: $BUILD_ID"
else
  crit "Não existe .next/BUILD_ID. Rode npm run build antes de reiniciar."
  add_check "Build Next" "critical" "Build ausente"
fi

echo ""
echo "Teste local Next:"
curl -I --max-time 10 http://127.0.0.1:3000 || crit "Next local não respondeu na porta 3000."

echo ""
echo "=================================================="
echo "9) LOGS RECENTES"
echo "=================================================="

echo ""
echo "Erros recentes luma-os:"
PM2_ERRORS="$(tail -n 80 /root/.pm2/logs/luma-os-error.log 2>/dev/null)"
echo "$PM2_ERRORS"

if echo "$PM2_ERRORS" | grep -Eiq "error|failed|exception|invariant|enoent|502"; then
  warn "Existem erros recentes no luma-os. Verificar PM2 logs."
  add_check "Logs PM2" "attention" "Erros recentes encontrados"
else
  add_check "Logs PM2" "ok" "Sem erros recentes"
fi

echo ""
echo "Erros recentes Nginx:"
NGINX_ERRORS="$(tail -n 80 /var/log/nginx/error.log 2>/dev/null)"
echo "$NGINX_ERRORS"

if echo "$NGINX_ERRORS" | grep -Eiq "emerg|crit|connect\(\) failed|upstream timed out|502|bind\(\)"; then
  warn "Existem erros recentes no Nginx. Se forem antigos, limpar log após backup."
  add_check "Logs Nginx" "attention" "Erros recentes encontrados"
else
  add_check "Logs Nginx" "ok" "Sem erros recentes"
fi

echo ""
echo "=================================================="
echo "10) SEGURANÇA BÁSICA"
echo "=================================================="

echo "UFW:"
UFW_STATUS="$(ufw status 2>/dev/null)"
echo "$UFW_STATUS"

if echo "$UFW_STATUS" | grep -qi "inactive"; then
  warn "UFW está inativo. Avaliar firewall depois que as rotas estiverem estáveis."
  add_check "Firewall UFW" "attention" "UFW inativo"
else
  add_check "Firewall UFW" "ok" "UFW ativo"
fi

echo ""
echo "npm audit resumido:"
AUDIT="$(timeout 60 npm audit --omit=dev --audit-level=moderate 2>/dev/null | sed -n '1,100p')"
echo "$AUDIT"

if echo "$AUDIT" | grep -Eiq "vulnerabilities|Severity: moderate|Severity: high|Severity: critical"; then
  warn "npm audit encontrou vulnerabilidades. Não rodar --force sem backup, porque pode quebrar Next."
  add_check "npm audit" "attention" "Vulnerabilidade encontrada"
else
  add_check "npm audit" "ok" "Sem alerta moderado/crítico"
fi

echo ""
echo "=================================================="
echo "11) SUGESTÕES INTELIGENTES DA MIA"
echo "=================================================="

if [ "$CRITICALS" -gt 0 ]; then
  suggest "🚨 Prioridade máxima: corrigir alertas críticos antes de mexer em layout ou novas features."
elif [ "$ALERTS" -gt 0 ]; then
  suggest "⚠️ Sistema está funcionando, mas existe atenção pendente. Resolver antes do lançamento oficial."
else
  suggest "✅ Sistema está estável. Próximo passo: testar jornada real de usuário, cadastro, login, pagamento e e-mails."
fi

suggest "🧠 Próximo nível: conectar este relatório ao OpenCode/API só quando existir alerta crítico, para economizar custo."
suggest "🛡️ Segurança: manter Apache bloqueado, Nginx ativo, PM2 salvo e backups antes de cada build."

cat "$SUGGESTIONS_FILE"

echo ""
echo "=================================================="
echo "RESULTADO FINAL"
echo "=================================================="
echo "Alertas: $ALERTS"
echo "Críticos: $CRITICALS"

if [ "$CRITICALS" -gt 0 ]; then
  LEVEL="critical"
  SUMMARY="Atenção urgente: existe risco real de queda ou erro crítico."
elif [ "$ALERTS" -gt 0 ]; then
  LEVEL="attention"
  SUMMARY="Sistema online, mas com pontos de atenção antes do lançamento."
else
  LEVEL="ok"
  SUMMARY="Sistema estável e pronto para testes de lançamento."
fi

echo "Nível: $LEVEL"
echo "$SUMMARY"

export TS REPORT LATEST JSON SUGGESTIONS_FILE CHECKS_FILE ALERTS CRITICALS LEVEL SUMMARY

python3 - <<'PY'
import os, json
from pathlib import Path

suggestions_path = Path(os.environ["SUGGESTIONS_FILE"])
checks_path = Path(os.environ["CHECKS_FILE"])

suggestions = []
if suggestions_path.exists():
    suggestions = [line.strip() for line in suggestions_path.read_text(encoding="utf-8", errors="ignore").splitlines() if line.strip()]

checks = []
if checks_path.exists():
    for line in checks_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        parts = line.split("|", 2)
        if len(parts) == 3:
            checks.append({"name": parts[0], "status": parts[1], "detail": parts[2]})

payload = {
    "ok": True,
    "source": "sualuma-copilot-local",
    "generated_at": os.environ["TS"],
    "level": os.environ["LEVEL"],
    "summary": os.environ["SUMMARY"],
    "alerts": int(os.environ["ALERTS"]),
    "criticals": int(os.environ["CRITICALS"]),
    "suggestions": suggestions[:12],
    "checks": checks,
    "report_path": os.environ["LATEST"],
}

Path(os.environ["JSON"]).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
PY

cp -f "$REPORT" "$LATEST"

echo ""
echo "Relatório TXT:"
echo "$LATEST"
echo ""
echo "Relatório JSON:"
echo "$JSON"

rm -f "$SUGGESTIONS_FILE" "$CHECKS_FILE"
