# Dostosowanie serwisu

Wszystko, co dotyczy tego serwisu, siedzi w dwóch katalogach: `site/` (nazwa, teksty, marka, strony, modele) i `industry/` (wiedza o branży). Katalogów `apps/` i `packages/` (silnik) zwykle nie trzeba ruszać. Po każdej zmianie: `docker compose up -d --build`.

## Nazwa, teksty, godziny wydań: `site/site.ts`

| Co | Gdzie |
|---|---|
| Nazwa serwisu, opis, temat („OPEX”) | `SITE` |
| Godziny dziennika, tygodnika, miesięcznika | `EDITION_TIMES` (czas polski) |
| Teksty strony „O serwisie” | `ABOUT` |
| Nazwy wydań, jednostki, formy liczby mnogiej | `REPORTS` (formy jako `[jeden, kilka, wiele]`, np. `["wpis", "wpisy", "wpisów"]`) |
| Próg alarmu „brak nowych treści” | `ALERTS.quietMinutes` |

## Marka: `site/brand/`

Logo i ikony serwisu. Nie używaj nazwy ani logo AIHOT; wzmianka o frameworku w stopce jest w porządku. Napisy na winietach wydań („OPEX DZIENNIK” itd.) generuje `node scripts/nameplates.ts`.

## Regulamin i prywatność: `site/pages/`

`terms.md` i `privacy.md` to **szablony**. Przed publicznym udostępnieniem wpisz prowadzącego serwis, kontakt i datę obowiązywania oraz sprawdź treść (RODO: serwis zapisuje opinie z formularza, w tym opcjonalny e-mail i zrzut ekranu).

## Kategorie i tagi: `industry/taxonomy.ts`

| Klucz | Nazwa na stronie | Zakres |
|---|---|---|
| `lean` | Lean i TPS | Toyota Production System, kaizen, gemba, standaryzacja, VSM, SMED, 5S |
| `opex` | OPEX i jakość | programy Operational Excellence, Six Sigma, zarządzanie procesami i jakością |
| `agile` | Agile i flow | Agile, Scrum, Kanban (metoda Kanban University), metryki przepływu, OKR |
| `costs` | Koszty | optymalizacja kosztów, koszty pośrednie (overheady), SG&A, produktywność |
| `supply-chain` | Łańcuch dostaw | transport i fracht, logistyka, magazyny, zapasy |
| `industry` | Przemysł | przemysł i motoryzacja: inwestycje, zakłady, wyniki, regulacje |
| `leadership` | Ludzie i kultura | przywództwo, rola managera, kultura (kategoria komentarzowa) |

Zmieniasz klucz kategorii? Zmień go też w `topics.json`, przykładach w promptach i testach (`npm run typecheck` pokaże miejsca). W tym samym pliku są tagi tematów, firmy i instytucje (`ENTITIES`) oraz słownik chroniący przed pomyleniem firm (`IDENTITY_LEXICON`).

## Tematy: `industry/topics.json`

Katalog stron `/topics` (np. „SMED”, „Koszty transportu”). Każdy temat wskazuje tagi lub firmy z `taxonomy.ts`; serwis sprawdza to przy starcie.

## Źródła

- Startowa lista: `industry/sources.json` (importowana tylko przy pierwszym uruchomieniu). Opis listy i źródła do dodania: [zrodla.md](zrodla.md).
- Później źródła dodajesz i zmieniasz w panelu: **Źródła** → **Nowe źródło** (RSS, lista na stronie przez selektory CSS, JSON). Najpierw **Podgląd pobierania**, potem **Utwórz**.
- Poziomy: `T1` źródła z pierwszej ręki (instytucje, autorzy metod), `T1_5` uznani praktycy, `T2` media branżowe. Od poziomu zależy próg wyboru.
- Tryby: `editorial` (teksty mogą trafić do wyboru), `hot_signal` (tylko sygnał popularności), `isolated` (nic nie publikuje).
- Newslettery z e-maila: [newslettery-n8n.md](newslettery-n8n.md).

## Co jest ważne, a co szumem: `industry/prompts/`

Najważniejsze pliki:

- `selection-score.md`: kim jest czytelnik, wagi typów treści, co ocenić wysoko (studia przypadków z liczbami, nowe metody, dane z badań, duże inwestycje), a co stłumić (reklamy szkoleń i certyfikacji, listy „5 powodów…”, ogólniki bez danych). Tu zapisujesz własne know-how; zostaw strukturę (typy treści, wymiary oceny, tłumienie szumu, zasady bezpieczeństwa), zmieniaj przykłady.
- `rules-domain.md`: polska terminologia (np. „wartość dodana”, „przezbrojenie (SMED)”, „koszty pośrednie”) i styl.

Pozostałe prompty (streszczenia, strukturyzacja, grupowanie, tygodnik, tłumaczenie) rzadko wymagają zmian.

## Progi wyboru: `industry/selection.ts`

Progi dla poziomów T1, T1_5, T2 (domyślnie 60 / 65 / 76). **Nie zmieniaj ich na oko**: najpierw oznacz własne przykłady i przeprowadź kalibrację ([kalibracja.md](kalibracja.md)).

## Modele: `site/models.ts` i `.env`

Domyślnie każdy krok używa modelu z `LLM_*` w `.env` (Gemini Flash). `site/models.ts` zawiera nazwane presety (`gemini-flash`, `gemini-flash-lite`, `groq`, `cerebras`, `mistral`), które przypisujesz krokom zmiennymi `*_MODEL` w `.env`, w `DEFAULTS` albo w panelu (**Modele i ewaluacja**).

## Własne funkcje: `modules/`

Funkcje potrzebne tylko temu serwisowi buduje się jako moduł w `modules/<nazwa>/`, bez zmian w silniku (opis po chińsku w `docs/architecture.md`, sekcja o modułach).
