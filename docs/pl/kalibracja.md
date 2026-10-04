# Kalibracja wyboru

Serwis decyduje o wyborze tekstu w kilku krokach. Odsiew sprawdza, czy tekst mieści się w zakresie serwisu. Potem model dwa razy niezależnie ocenia go w skali 0–100 według `industry/prompts/selection-score.md`. Tekst przechodzi, gdy obie oceny przekroczą próg poziomu źródła z `industry/selection.ts` (domyślnie T1 60, T1_5 65, T2 76). Na końcu serwis sprawdza, czy ta sama wiadomość nie jest już w wyborze.

Domyślne progi są punktem startowym. Dopasuj je do swojego gustu na własnych oznaczonych przykładach.

## 1. Przygotuj przykłady

Po tygodniu lub dwóch działania serwisu wybierz 100–200 tekstów z własnych źródeł, zarówno wybranych, jak i odrzuconych, i oznacz każdy: wybrać / odrzucić. Zapisz je w `.data/gold.jsonl` (katalog `.data/` nie trafia do Gita), po jednym tekście w linii, jak w [`industry/gold.example.jsonl`](../../industry/gold.example.jsonl):

```json
{"caseId":"smed-001","material":{"title":"Tytuł oryginału","originalTitle":null,"publishedAt":"2026-10-01T09:00:00+02:00","sourceName":"Lean Enterprise Institute","bodyZh":null,"bodyOriginal":"Treść…"},"sourceFacts":{"sourceKind":"rss","sourceTier":"T1","firstParty":true,"language":"en"},"samplingContext":{"benchmarkSplit":"development","samplingStratum":"case-study"},"gold":{"decision":"select"}}
```

| Pole | Znaczenie |
|---|---|
| `caseId` | unikalny identyfikator |
| `material` | tytuł, data, nazwa źródła i treść. `bodyZh` to treść w języku czytelnika (polska; nazwa pola pochodzi z frameworka), `bodyOriginal` to oryginał; wystarczy jedno z nich |
| `sourceFacts` | typ źródła, poziom (decyduje o progu), czy z pierwszej ręki (tylko T1), język |
| `samplingContext` | opcjonalne: `benchmarkSplit` (`development` albo `holdout`), `samplingStratum` (własna grupa, np. „studium przypadku”, „reklama szkolenia”) |
| `gold.decision` | `select` wybrać, `reject` odrzucić, `either` obojętne (nie liczy się do trafności) |

Wskazówki:

- Dodaj dużo **trudnych przypadków**, czyli tekstów na granicy. Same oczywiste przypadki zawyżą wynik.
- Odłóż część jako zbiór kontrolny (`"benchmarkSplit": "holdout"`). Prompt poprawiaj tylko na zbiorze `development`, a na końcu sprawdź `holdout`.
- Oznaczaj tak, jak oceniałby czytelnik serwisu, np. kierownik produkcji albo lider CI.
- Oceniaj sam tekst. Nie odrzucaj go dlatego, że ta sama wiadomość jest już w wyborze: duplikaty usuwa osobny krok.

## 2. Uruchom ewaluację

Na serwerze (kontener ma dostęp do `.env` i bazy):

```bash
docker compose cp .data/gold.jsonl worker:/data/gold.jsonl
docker compose exec worker node scripts/eval-selection.ts --gold /data/gold.jsonl --split development --label "wersja 1"
```

Wynik to trafność, precyzja (ile wybranych było trafnych) i czułość (ile wartych wyboru wybrano), symulacja innych progów od 40 do 90 oraz lista pomyłek. Każdy przebieg pojawia się w panelu w zakładce **SelectBench**. Powtórne uruchomienie używa zapisanych odpowiedzi, więc nie zużywa limitu modelu drugi raz.

Porównanie modeli na tych samych przykładach: `--models default,groq`.

## 3. Popraw kryteria, potem progi

W **SelectBench** przejrzyj pomyłki i uzasadnienia modelu:

- **Wartościowy tekst odrzucony:** prompt nie mówi, dlaczego taki tekst jest ważny. Dopisz ten rodzaj wartości z przykładem w `selection-score.md`.
- **Szum przepuszczony:** dopisz go do części o tłumieniu szumu, np. reklamy szkoleń, ogólniki, listy porad bez danych.
- **Całość za luźna albo za ostra, a pomyłki mają oceny tuż przy progu:** dopiero wtedy przesuń progi w `industry/selection.ts`.

Najpierw kryteria, potem progi: próg przesuwa wszystko naraz i nie naprawi pomyłek w jednej kategorii. Po każdej zmianie uruchom ewaluację ponownie i porównaj wersje w SelectBench. Zmiany w `industry/` wymagają przebudowy kontenerów (`docker compose up -d --build`).
