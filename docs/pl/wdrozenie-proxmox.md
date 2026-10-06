# Wdrożenie na serwerze domowym (Proxmox)

Serwis składa się z pięciu kontenerów Dockera: baza PostgreSQL, `api`, `worker` (pobieranie źródeł, wywołania modeli, wydania), `web` (strona) i jednorazowy `setup` (migracje bazy i import źródeł). Wszystko startuje jednym poleceniem `docker compose`.

## 1. Maszyna w Proxmoxie

Zalecana jest **maszyna wirtualna (VM)**, nie kontener LXC: Docker w VM działa bez dodatkowych ustawień.

| Ustawienie | Wartość |
|---|---|
| System | Debian 12 lub Ubuntu Server 24.04 (obraz ISO wgrany do Proxmoxa) |
| CPU | 2 vCPU (typ `host`) |
| RAM | 4 GB (minimum 3 GB; budowanie strony zużywa najwięcej) |
| Dysk | 30 GB |
| Sieć | most `vmbr0`, najlepiej stały adres IP z routera (rezerwacja DHCP) |

W Proxmoxie: **Create VM** → wybierz ISO → ustaw powyższe → zainstaluj system z serwerem SSH.

> **LXC zamiast VM?** Też zadziała, ale kontener musi mieć włączone `nesting=1` i `keyctl=1` (Options → Features), a najlepiej być typu *unprivileged*. Przy problemach z Dockerem w LXC wróć do VM.

## Szybka instalacja jednym skryptem

Na nowej maszynie (zalogowany przez SSH albo w konsoli Proxmoxa):

```bash
curl -fsSL https://raw.githubusercontent.com/CzubekxD/Excellence-News/main/deploy/install.sh -o install.sh
sudo bash install.sh
```

Skrypt [`deploy/install.sh`](../../deploy/install.sh):

1. instaluje Dockera (jeśli go nie ma),
2. pobiera kod do `/opt/excellence-news`,
3. tworzy `.env` z losowymi hasłami i pyta o dwie rzeczy: adres serwisu (Enter przyjmuje podpowiedź z adresem IP maszyny) i klucz Gemini (wklejasz go u siebie w terminalu; nie jest widoczny przy wpisywaniu i trafia tylko do `.env` na tym serwerze),
4. buduje i uruchamia kontenery, czeka na stronę i wypisuje adres strony, panelu oraz **hasło administratora** (zapisz je).

Ten sam skrypt służy do aktualizacji: `sudo bash /opt/excellence-news/deploy/install.sh` pobiera nowy kod i przebudowuje kontenery, a `.env` zostawia bez zmian.

Jeśli repozytorium jest prywatne, `curl` go nie pobierze: najpierw `git clone` (z zalogowaniem do GitHuba), potem `sudo ./deploy/install.sh` w katalogu repozytorium.

Punkty 2–4 poniżej opisują to samo ręcznie.

## 2. Docker

Na nowej maszynie (jako użytkownik z `sudo`):

```bash
sudo apt update && sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # potem wyloguj się i zaloguj ponownie
docker compose version          # sprawdzenie
```

## 3. Kod i konfiguracja

```bash
git clone https://github.com/CzubekxD/Excellence-News.git
cd Excellence-News
```

Plik `.env` możesz utworzyć na dwa sposoby:

**A. Skryptem** (wygeneruje losowe hasła; Node.js uruchamia się w jednorazowym kontenerze, nie trzeba go instalować):

```bash
docker run --rm -v "$PWD":/app -w /app node:24-slim node scripts/init-env.ts --llm-key TWOJ_KLUCZ_GEMINI
sudo chown $USER .env
nano .env    # popraw SITE_URL na adres serwera
```

Skrypt wypisze hasło administratora; zapisz je.

**B. Ręcznie:**

```bash
cp .env.example .env
nano .env
```

i uzupełnij:

| Zmienna | Co wpisać |
|---|---|
| `SITE_URL` | adres, pod którym otwierasz serwis, np. `http://192.168.1.50:3000` |
| `ADMIN_PASSWORD` | hasło do panelu `/admin` (min. 12 znaków) |
| `SESSION_SECRET`, `IMG_PROXY_SIGN_SECRET` | po jednym wyniku `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | wynik `openssl rand -hex 18` |
| `LLM_API_KEY` | klucz Gemini (niżej) |

**Klucz Gemini (darmowy):** wejdź na <https://aistudio.google.com>, zaloguj się kontem Google, kliknij **Get API key** → **Create API key** i skopiuj klucz do `LLM_API_KEY`. Klucza nie wysyłaj nikomu i nie wrzucaj do Gita (`.env` jest w `.gitignore`).

## 4. Uruchomienie

```bash
docker compose up -d --build
docker compose logs -f setup     # migracje i import źródeł; kończy się sam
```

Pierwsze budowanie trwa kilka minut. Potem:

- strona: `http://ADRES_SERWERA:3000`
- panel: `http://ADRES_SERWERA:3000/admin` (hasło z `ADMIN_PASSWORD`)

Worker od razu zaczyna pobierać 33 źródła z [`industry/sources.json`](../../industry/sources.json). Pierwsze wybrane wiadomości pojawią się po kilkunastu–kilkudziesięciu minutach. Dziennik wychodzi codziennie o 7:00, tygodnik w poniedziałki o 7:30, miesięcznik pierwszego dnia miesiąca o 8:00 (czas polski; zmiana w `site/site.ts`, `EDITION_TIMES`).

Przydatne polecenia (w katalogu z kodem, po instalacji skryptem `/opt/excellence-news`; bez `sudo` po dodaniu się do grupy: `sudo usermod -aG docker $USER` i ponownym zalogowaniu):

```bash
docker compose ps                  # stan kontenerów
docker compose logs -f worker      # co robi worker
docker compose restart worker      # po zmianie .env
docker compose down                # zatrzymanie (dane zostają w wolumenach)
```

## 5. Limity darmowego Gemini

Darmowy plan Gemini ma dzienne i minutowe limity zapytań; Google je zmienia, aktualne widać w AI Studio. Jeden tekst przechodzi kilka kroków (odsiew, dwie oceny, streszczenie, strukturyzacja, grupowanie), a przy 30 źródłach to zwykle kilkaset wywołań dziennie.

Gdy w panelu (**Działanie** i **Modele i ewaluacja**) widać błędy limitu (HTTP 429):

1. Załóż darmowe konto w Groq (<https://console.groq.com>) albo Cerebras (<https://cloud.cerebras.ai>).
2. Dopisz do `.env` np.:
   ```
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_API_KEY=twoj_klucz_groq
   PREFILTER_MODEL=groq
   GROUP_REVIEW_MODEL=groq
   ```
3. `docker compose up -d` (przeładowuje konfigurację).

Model kroku można też zmienić w panelu: **Modele i ewaluacja** → **Zmień**.

Bezpieczniki: `MODEL_CALLS_ENABLED=false` zatrzymuje wszystkie wywołania modeli, `COLLECT_ENABLED=false` zatrzymuje pobieranie.

## 6. Dostęp spoza domu (opcjonalnie)

Bez otwierania portów najprościej przez **Cloudflare Tunnel** (darmowy, wymaga domeny w Cloudflare) albo **Tailscale** (dostęp tylko dla Ciebie). Przy tunelu lub innym reverse proxy ustaw w `.env`:

```
SITE_URL=https://news.twojadomena.pl
TRUST_PROXY=true
```

Własna domena z automatycznym HTTPS bezpośrednio z serwera (porty 80 i 443 przekierowane na routerze):

```
SITE_DOMAIN=news.twojadomena.pl
SITE_URL=https://news.twojadomena.pl
PORT=127.0.0.1:3000
TRUST_PROXY=true
```

```bash
docker compose --profile https up -d --build
```

Zanim udostępnisz serwis publicznie, uzupełnij [regulamin](../../site/pages/terms.md) i [politykę prywatności](../../site/pages/privacy.md): to szablony z miejscami do wypełnienia.

## 7. Aktualizacja

```bash
sudo bash /opt/excellence-news/deploy/install.sh
```

albo ręcznie w katalogu z kodem: `git pull && docker compose up -d --build`.

Migracje bazy uruchamiają się same (kontener `setup`).

## 8. Kopie zapasowe

- **Proxmox:** zaplanuj backup całej VM (Datacenter → Backup), np. codziennie w nocy. To najprostsza pełna kopia.
- **Sama baza:**
  ```bash
  docker compose exec db pg_dump -U aihot aihot | gzip > excellence-$(date +%F).sql.gz
  ```
- Opcjonalnie codzienna kopia do magazynu S3 (Backblaze B2, Cloudflare R2): zmienne `DB_BACKUP_STORE_*` w `.env.example`.

## Gdy coś nie działa

| Objaw | Co sprawdzić |
|---|---|
| Strona nie odpowiada | `docker compose ps`, `docker compose logs web api` |
| Brak nowych wiadomości | panel → **Działanie** (worker, kolejki), **Źródła** (błędy pobierania), `docker compose logs worker` |
| Błędy modelu 401/403 | klucz w `LLM_API_KEY`; po zmianie `docker compose up -d` |
| Błędy 429 | limit darmowego planu, patrz punkt 5 |
| `setup` kończy się błędem | `docker compose logs setup`; często literówka w `.env` |
