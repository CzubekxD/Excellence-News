# Excellence News

**Serwis wiadomości o Operational Excellence, Lean, TPS, Agile i Kanbanie, optymalizacji kosztów (overheady, transport), łańcuchu dostaw, przemyśle i motoryzacji. W całości po polsku.**

Serwis sam czyta kilkadziesiąt źródeł po polsku, angielsku, francusku i hiszpańsku. Model językowy odsiewa szum i ocenia, co jest warte uwagi praktyka. Wybrane teksty dostają polski tytuł i streszczenie, relacje o tej samej sprawie łączą się w jedno wydarzenie, a codziennie rano wychodzi dziennik, w poniedziałki tygodnik, a na początku miesiąca miesięcznik.

## Co dostajesz

- **Wybór:** najważniejsze teksty dnia z polskim tytułem, streszczeniem i uzasadnieniem „Dlaczego warto”.
- **Wszystkie:** pełny strumień z filtrami według kategorii: Lean i TPS, OPEX i jakość, Agile i flow, Koszty, Łańcuch dostaw, Przemysł, Ludzie i kultura.
- **Na czasie:** sprawy omawiane przez najwięcej niezależnych źródeł.
- **Wydarzenia:** wszystkie relacje o jednej sprawie w jednym miejscu, z zarysem i osią czasu.
- **Tematy:** strony tematów, np. SMED, Kanban, koszty transportu, Six Sigma.
- **Dziennik, tygodnik, miesięcznik:** wydania w formie gazety, archiwum wydań.
- **Kanały:** RSS, publiczne API, Markdown dla agentów AI i serwer MCP (prefiks `exnews`).
- **Panel administratora** (`/admin`): źródła, diagnostyka każdego tekstu, ręczne poprawki, modele, koszty, opinie czytelników.

## Jak to działa

1. **Pobieranie:** RSS, listy na stronach i newslettery (przez n8n) z [30 sprawdzonych źródeł startowych](docs/pl/zrodla.md).
2. **Odsiew:** model sprawdza, czy tekst dotyczy zakresu serwisu.
3. **Ocena:** dwie niezależne oceny 0–100 według kryteriów z [`industry/prompts/selection-score.md`](industry/prompts/selection-score.md). Tekst przechodzi, gdy obie przekroczą próg poziomu źródła.
4. **Pisanie:** polski tytuł i streszczenie, zgodnie z terminologią z [`rules-domain.md`](industry/prompts/rules-domain.md). Bez zmyślania, z kotwicą czasu.
5. **Grupowanie:** te same fakty i wydarzenia z różnych źródeł łączą się w jedno.
6. **Wydania:** dziennik o 7:00, tygodnik w poniedziałek o 7:30, miesięcznik o 8:00 (czas polski).

Czytelnik otwierający stronę nie uruchamia modelu: wszystko liczy się w tle.

## Modele: darmowe

Domyślnie **Gemini Flash** przez darmowy klucz z [Google AI Studio](https://aistudio.google.com). Gdy darmowy limit nie wystarcza, wybrane kroki można przenieść do **Groq** lub **Cerebras** (też z darmowymi limitami). Szczegóły: [`.env.example`](.env.example) i [`site/models.ts`](site/models.ts).

## Uruchomienie

Instrukcja krok po kroku dla serwera domowego z Proxmoxem: **[docs/pl/wdrozenie-proxmox.md](docs/pl/wdrozenie-proxmox.md)**.

W skrócie (Debian lub Ubuntu, np. VM w Proxmoxie):

```bash
curl -fsSL https://raw.githubusercontent.com/CzubekxD/Excellence-News/main/deploy/install.sh -o install.sh
sudo bash install.sh        # instaluje Dockera, pyta o adres i klucz Gemini, uruchamia serwis
```

Strona: `http://adres-serwera:3000`, panel: `/admin` (hasło wypisze skrypt). Ten sam skrypt aktualizuje serwis.

## Dostosowanie

| Co | Gdzie |
|---|---|
| Nazwa, teksty, godziny wydań | [`site/site.ts`](site/site.ts) |
| Kategorie, tagi, firmy i instytucje | [`industry/taxonomy.ts`](industry/taxonomy.ts) |
| Tematy | [`industry/topics.json`](industry/topics.json) |
| Źródła startowe | [`industry/sources.json`](industry/sources.json), potem panel |
| Co jest ważne, a co szumem | [`industry/prompts/`](industry/prompts/) |
| Progi wyboru | [`industry/selection.ts`](industry/selection.ts) |
| Regulamin i prywatność (szablony do uzupełnienia) | [`site/pages/`](site/pages/) |

## Dokumentacja

- [Wdrożenie na Proxmoxie](docs/pl/wdrozenie-proxmox.md)
- [Dostosowanie serwisu](docs/pl/dostosowanie.md)
- [Źródła: lista i dodawanie nowych](docs/pl/zrodla.md)
- [Kalibracja wyboru](docs/pl/kalibracja.md)
- [Newslettery przez n8n](docs/pl/newslettery-n8n.md)

Dokumentacja techniczna frameworka (architektura, grupowanie, szczegóły źródeł) jest po chińsku w katalogu [`docs/`](docs/), tak jak w projekcie bazowym.

## Rozwój

Node.js 24 uruchamia TypeScript bezpośrednio, bez kroku budowania backendu.

```bash
npm ci
npm run typecheck
DATABASE_URL=postgres://127.0.0.1:5432/excellence_test npm test   # nazwa bazy musi kończyć się na _test
npm run build -w @aihot/web
```

Wskazówki dla agentów AI piszących kod: [`AGENTS.md`](AGENTS.md).

## Licencja i pochodzenie

Serwis jest zbudowany na otwartym frameworku [AIHOT](https://github.com/KKKKhazix/AIHOT) (licencja MIT). Kod jest na [licencji MIT](LICENSE). Nazwa i logo AIHOT nie są objęte licencją i nie są tu używane. Czcionki mają własną licencję, opisaną w [NOTICE](NOTICE).
