# Pakiet branżowy

Tu jest cała wiedza o branży: kategorie, tematy, źródła, kryteria wyboru i progi. Zmiana branży to głównie zmiana tego katalogu i [`site/`](../site/) (nazwa, teksty, marka i strony). Opis krok po kroku: [docs/pl/dostosowanie.md](../docs/pl/dostosowanie.md).

| Plik | Zawartość |
|---|---|
| `taxonomy.ts` | Kategorie, tagi, firmy i instytucje, słownik chroniący przed pomyleniem firm |
| `topics.json` | Katalog tematów (`/topics`), czytany przy starcie serwisu |
| `sources.json` | Źródła importowane przy pierwszym uruchomieniu |
| `prompts/` | Prompty każdego kroku: odsiew, ocena, pisanie, strukturyzacja, grupowanie, zarys wydarzenia, tygodnik i miesięcznik, tłumaczenie |
| `selection.ts` | Progi wyboru |
| `gold.example.jsonl` | Format przykładowych oznaczonych tekstów do ewaluacji wyboru |
| `relation-gold.example.jsonl` | Format przykładów do ewaluacji relacji między wydarzeniami |
| `story-digest-eval.example.jsonl` | Format przykładów do ewaluacji zarysów wydarzeń |

Najważniejsze dla jakości są `prompts/selection-score.md` (co jest ważne, a co jest szumem dla czytelnika) i `prompts/rules-domain.md` (terminologia i styl polszczyzny). Tam zapisujesz własne know-how.
