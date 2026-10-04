# Wskazówki dla agentów

To Excellence News: polskojęzyczny serwis wiadomości o Operational Excellence, Lean/TPS, Agile/Kanban, kosztach, łańcuchu dostaw, przemyśle i motoryzacji, zbudowany na frameworku AIHOT. Serwis pobiera źródła, wybiera i streszcza teksty modelem, grupuje wydarzenia, wydaje dziennik, tygodnik i miesięcznik, a publikuje przez stronę, RSS, publiczne API, Markdown dla agentów i MCP. Zacznij od README, potem przeczytaj dokument z `docs/pl/` właściwy dla zadania (techniczna dokumentacja frameworka w `docs/*.md` jest po chińsku).

## Język i czas

- Czytelnik czyta po polsku (`READER_LANGUAGE = "pl"`, `packages/backend/src/lib/language.ts`). Pola i kolumny z `zh`/`Zh` w nazwie (`title_zh`, `summaryZh`, `bodyZh`, `language: "zh"` w trasach) to nazwy z frameworka: przechowują **tekst w języku czytelnika, czyli po polsku**. Nie zmieniaj ich nazw (migracje, kontrakty, testy).
- Strefa czasu serwisu to `Europe/Warsaw` z czasem letnim (`packages/contracts/src/time.ts`, funkcje `site*`). Nie wpisuj stałych przesunięć.
- Liczba mnoga: `plural()` i `count()` z `site/site.ts` z formami `[jeden, kilka, wiele]`.
- Teksty dla czytelnika piszemy naturalną polszczyzną; terminologia branżowa jest w `industry/prompts/rules-domain.md`.

## Najczęstsze zadanie: zmiana treści lub zakresu

Kolejność opisuje `docs/pl/dostosowanie.md`. Własne rzeczy serwisu są w `site/`: nazwa i teksty (`site.ts`), model każdego kroku (`models.ts`), marka i logo (`brand/`), regulamin i prywatność (`pages/`), pliki publikowane w katalogu głównym strony (`public/`), lista zmian (`changelog.json`). Wiedza branżowa jest w `industry/`: kategorie i tagi (`taxonomy.ts`), tematy (`topics.json`), źródła startowe (`sources.json`), prompty (`prompts/`), progi (`selection.ts`). Zwykle nie trzeba ruszać `apps/` i `packages/`. Funkcje potrzebne tylko temu serwisowi buduje się jako moduł w `modules/` (sekcja o modułach w `docs/architecture.md`).

Tych decyzji nie podejmuj za właściciela, tylko go zapytaj: nazwa serwisu, które źródła obserwować, co jest ważne, a co szumem, podział na kategorie, treść regulaminu i polityki prywatności (`site/pages/` to szablony, które przed publikacją musi zatwierdzić właściciel).

Przy zmianie kryteriów oceny zachowaj strukturę: typy treści, pięć ważonych wymiarów, tłumienie szumu i granice bezpieczeństwa. Zmieniasz przykłady tego, co ważne i co jest szumem. Progi kalibruje się na przykładach oznaczonych przez właściciela (`docs/pl/kalibracja.md`), nie na oko.

## Uruchamianie i sprawdzanie

- Node.js 24 uruchamia TypeScript bezpośrednio; backend nie ma kroku budowania. Workspaces npm: `apps/*`, `packages/*`, `industry`, `site`, `modules/*`.
- Uruchomienie lokalne i Docker: `docs/pl/wdrozenie-proxmox.md` (szczegóły po chińsku w `docs/deploy.md`).
- Po zmianach uruchom co najmniej:
  ```bash
  npm run typecheck
  DATABASE_URL=postgres://127.0.0.1:5432/<nazwa>_test npm test   # nazwa musi kończyć się na _test lub _ci; baza powstanie sama, konto musi móc tworzyć bazy
  npm run build -w @aihot/web && node --test apps/web/tests/*.test.ts
  node scripts/smoke.ts --base http://localhost:3000             # gdy serwis działa
  ```
- Testy w `tests/` korzystają z kategorii, tagów i firm z `industry/taxonomy.ts`. Po zmianie taksonomii zamień przykłady w testach na odpowiedniki. Nazwane modele w testach (`qwen3.7-flash`, `deepseek-flash`…) to atrapy zdefiniowane w `tests/setup.ts`, nie modele serwisu.

## Zasady, których pilnujemy

- Frontend (`apps/web`) czyta `apps/api` wyłącznie przez HTTP. Baza danych, wywołania modeli i klucze są tylko w backendzie.
- Wszystkie publiczne wyjścia czytają z jednej warstwy, `packages/backend/src/publication/`. Nowe publiczne wyjście też.
- Otwarcie strony przez czytelnika nie wywołuje modelu. Modele wywołują tylko zadania workera.
- Każde płatne zapytanie przechodzi przez pokwitowanie (`providers/receipts.ts`) i bezpiecznik budżetu. Nie omijaj go.
- Bezpieczniki otwiera tylko wartość `true`. W trakcie programowania trzymaj je wyłączone: `COLLECT_ENABLED`, `MODEL_CALLS_ENABLED`, `FEISHU_*_ENABLED`, `INDEXNOW_SUBMIT_ENABLED`. W testach powiadomienia są zawsze wyłączone, a pobieranie i modele łączą się tylko z lokalnymi atrapami.
- Źródła domyślnie pokazują tylko streszczenie i link (`site_fulltext` wyłączone). Pełny tekst włączaj tylko wtedy, gdy źródło wyraźnie na to pozwala.
- Treści publiczne są anonimowe: administrator i gość widzą to samo. Panel jest tylko dla administratora.
- Wycofując funkcję albo mechanizm, w tej samej zmianie usuń jej kod, testy, dokumentację i zapisany stan: tabele i kolumny, zadania cykliczne, ustawienia, zmienne środowiskowe i wpisy w `.env.example`. Jeśli usunięcie skasuje dane użytkownika, opisz to w instrukcji aktualizacji. Blokady, ponowienia, zgodność ze starym formatem, przełączniki i obejścia dodawaj tylko na dowodach: zdarzyło się to we wdrożeniu albo wynika z semantyki platformy.
- Migracje bazy są w `database/migrations/` (tabele jednego modułu w jego `migrations/`) i wykonują się w kolejności pełnych nazw plików. Nowa migracja dostaje nową nazwę; opublikowanych migracji się nie zmienia. Od `0055` każdy plik zawiera jedno polecenie możliwe do wykonania online, indeksy tworzy się przez `CONCURRENTLY IF NOT EXISTS`, a duże uzupełnienia danych nie trafiają do migracji publikowanych. Walidację ograniczeń i zmiany niszczące projektuj według konwencji migracji z `docs/architecture.md`.
- Nie commituj `.env`, kluczy ani `.data/`. Nie proś właściciela o klucze API: wpisuje je sam w `.env` na serwerze.
- Nie używaj nazwy ani logo AIHOT jako marki serwisu. Wzmianka o frameworku w stopce i README jest w porządku.

## Pisanie kodu

Dopasuj się do otaczającego kodu: styl, nazewnictwo, gęstość komentarzy (w silniku komentarze są po angielsku, w `site/` i `industry/` po polsku). Wybieraj proste rozwiązania i definiuj tylko abstrakcje, których używasz. Sprawdzaj ważne zachowania, których dotyczy zmiana; drobne zmiany stylu nie wymagają testów.
