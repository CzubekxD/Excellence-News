#!/usr/bin/env bash
# Instalacja i aktualizacja Excellence News na Debianie lub Ubuntu (VM albo LXC w Proxmoxie).
#
#   Pierwsza instalacja (repozytorium publiczne):
#     curl -fsSL https://raw.githubusercontent.com/CzubekxD/Excellence-News/main/deploy/install.sh -o install.sh && sudo bash install.sh
#   Albo z pobranego repozytorium:
#     sudo ./deploy/install.sh
#   Aktualizacja: uruchom ten sam skrypt jeszcze raz (pobierze nowy kod i przebuduje kontenery; .env zostaje).
#
# Skrypt instaluje Dockera, pobiera kod do /opt/excellence-news (albo używa repozytorium, w którym leży),
# tworzy .env z losowymi hasłami i pyta o adres serwisu i klucz Gemini. Klucz zostaje tylko w .env na tym
# serwerze (plik z prawami 600, ignorowany przez Gita).
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/CzubekxD/Excellence-News.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/excellence-news}"
PORT="${PORT:-3000}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mBłąd: %s\033[0m\n' "$*" >&2; exit 1; }
# Pytania czytają z terminala, także gdy skrypt przyszedł przez potok.
ask() { local prompt=$1 default=${2:-} answer; read -r -p "$prompt" answer </dev/tty || true; printf '%s' "${answer:-$default}"; }
ask_secret() { local prompt=$1 answer; read -r -s -p "$prompt" answer </dev/tty || true; printf '\n' >/dev/tty; printf '%s' "$answer"; }

# Ustawia KLUCZ=wartość w .env: zamienia istniejącą linię (także zakomentowaną wzorcową) albo dopisuje nową.
set_env() {
  local file=$1 key=$2 value=$3 tmp
  tmp=$(mktemp)
  awk -v key="$key" -v value="$value" '
    BEGIN { done = 0 }
    !done && ($0 ~ "^" key "=" || $0 ~ "^# ?" key "=") { print key "=" value; done = 1; next }
    { print }
    END { if (!done) print key "=" value }
  ' "$file" >"$tmp"
  cat "$tmp" >"$file"
  rm -f "$tmp"
}
env_value() { sed -n "s/^$2=//p" "$1" | head -n1; }

[ "$(id -u)" -eq 0 ] || fail "uruchom przez sudo albo jako root."
command -v apt-get >/dev/null || fail "skrypt obsługuje Debiana i Ubuntu (apt)."

say "Pakiety systemowe"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git openssl >/dev/null

if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  say "Instalacja Dockera"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true
docker info >/dev/null 2>&1 || fail "Docker nie działa. W kontenerze LXC włącz w Proxmoxie Options → Features: nesting i keyctl, uruchom kontener ponownie i spróbuj jeszcze raz."

# Kod: repozytorium, w którym leży ten skrypt, albo klon w INSTALL_DIR.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "")
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/../docker-compose.yml" ]; then
  APP_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
else
  APP_DIR=$INSTALL_DIR
fi
if [ -d "$APP_DIR/.git" ]; then
  say "Aktualizacja kodu w $APP_DIR"
  git -C "$APP_DIR" pull --ff-only
else
  say "Pobieranie kodu do $APP_DIR"
  git clone --depth 1 "$REPO_URL" "$APP_DIR" || fail "nie udało się pobrać $REPO_URL. Prywatne repozytorium pobierz ręcznie (git clone) i uruchom sudo ./deploy/install.sh z jego katalogu."
fi
cd "$APP_DIR"

ADMIN_PASSWORD_NEW=""
if [ ! -f .env ]; then
  say "Konfiguracja (.env)"
  cp .env.example .env
  chmod 600 .env
  ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  site_url=$(ask "Adres serwisu [http://${ip:-localhost}:$PORT]: " "http://${ip:-localhost}:$PORT")
  echo "Klucz Gemini: https://aistudio.google.com → Get API key. Wklej go tutaj (nie będzie widoczny); Enter, żeby dopisać później."
  llm_key=$(ask_secret "Klucz Gemini: ")
  ADMIN_PASSWORD_NEW=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)
  set_env .env SITE_URL "$site_url"
  set_env .env ADMIN_PASSWORD "$ADMIN_PASSWORD_NEW"
  set_env .env SESSION_SECRET "$(openssl rand -hex 32)"
  set_env .env IMG_PROXY_SIGN_SECRET "$(openssl rand -hex 32)"
  set_env .env POSTGRES_PASSWORD "$(openssl rand -hex 18)"
  [ -n "$llm_key" ] && set_env .env LLM_API_KEY "$llm_key"
  [ "$PORT" != "3000" ] && set_env .env PORT "$PORT"
else
  say "Istniejący .env zostaje bez zmian"
fi
[ -n "$(env_value .env LLM_API_KEY)" ] || echo "Uwaga: LLM_API_KEY w $APP_DIR/.env jest pusty: serwis pobierze źródła, ale nie wybierze ani nie streści tekstów. Po wpisaniu klucza: cd $APP_DIR && docker compose up -d"

say "Budowanie i uruchamianie (pierwszy raz kilka minut)"
docker compose up -d --build

say "Czekam na stronę"
url="http://127.0.0.1:$PORT/"
for _ in $(seq 1 90); do
  if curl -fsS -o /dev/null "$url"; then break; fi
  sleep 2
done
curl -fsS -o /dev/null "$url" || fail "strona nie odpowiada. Sprawdź: cd $APP_DIR && docker compose ps && docker compose logs setup api web"

site_url=$(env_value .env SITE_URL)
say "Gotowe"
echo "Strona:  $site_url"
echo "Panel:   $site_url/admin"
if [ -n "$ADMIN_PASSWORD_NEW" ]; then
  echo "Hasło administratora: $ADMIN_PASSWORD_NEW (zapisane też w $APP_DIR/.env jako ADMIN_PASSWORD)"
fi
echo "Logi workera: cd $APP_DIR && docker compose logs -f worker"
echo "Aktualizacja: sudo bash $APP_DIR/deploy/install.sh"
