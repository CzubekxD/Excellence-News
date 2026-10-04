# Źródła

Lista startowa jest w [`industry/sources.json`](../../industry/sources.json) i importuje się przy pierwszym uruchomieniu. Wszystkie kanały RSS sprawdzono przy tworzeniu serwisu (październik 2026). Później źródła zmieniasz w panelu (**Źródła**); panel pokazuje, które przestały działać.

Teksty po angielsku, francusku i hiszpańsku serwis streszcza po polsku; pełne treści zostają na stronach źródeł (domyślnie serwis pokazuje tylko streszczenie i link).

## Lista startowa (30 źródeł)

**Poziom** decyduje o progu wyboru: `T1` źródła z pierwszej ręki (instytucje, autorzy metod), `T1_5` uznani praktycy i eksperci, `T2` media branżowe (najwyższy próg, bo dużo szumu).

### Lean, TPS, Operational Excellence

| Źródło | Poziom | Język | Kanał |
|---|---|---|---|
| Lean Enterprise Institute | T1 | EN | https://www.lean.org/feed/ |
| Institut Lean France | T1 | FR | https://www.institut-lean-france.fr/feed/ |
| Mark Graban: Lean Blog | T1_5 | EN | https://leanblog.org/feed/ |
| Gemba Academy | T1_5 | EN | https://blog.gembaacademy.com/feed/ |
| KaiNexus | T1_5 | EN | https://blog.kainexus.com/rss.xml |
| The Lean Thinker | T1_5 | EN | https://theleanthinker.com/feed/ |
| All About Lean (Christoph Roser) | T1_5 | EN | https://www.allaboutlean.com/feed/ |
| Operational Excellence Mixtape | T1_5 | EN | https://ryanmccormack.substack.com/feed |
| Progressa Lean | T1_5 | ES | https://www.progressalean.com/feed/ |
| APQC (benchmarki procesów i kosztów) | T1 | EN | https://www.apqc.org/blog/rss.xml |

### Agile i Kanban

| Źródło | Poziom | Język | Kanał |
|---|---|---|---|
| Scrum.org | T1 | EN | https://www.scrum.org/resources/blog/rss.xml |
| Kanban University | T1 | EN | https://kanban.university/feed/ |
| Mike Cohn: Mountain Goat Software | T1_5 | EN | https://www.mountaingoatsoftware.com/blog/rss |
| Stefan Wolpers: Age of Product | T1_5 | EN | https://age-of-product.com/feed/ |
| Paweł Brodziński | T1_5 | PL | https://brodzinski.com/feed |
| Agile Spain | T1_5 | ES | https://agile-spain.org/feed/ |
| OCTO Technology | T1_5 | FR | https://blog.octo.com/feed |

### Koszty i operacje

| Źródło | Poziom | Język | Kanał |
|---|---|---|---|
| McKinsey Insights | T1 | EN | https://www.mckinsey.com/insights/rss |
| CFO Dive (koszty, overheady, zakupy) | T2 | EN | https://www.cfodive.com/feeds/news/ |
| Manager+ | T2 | PL | https://managerplus.pl/feed |

### Łańcuch dostaw i transport

| Źródło | Poziom | Język | Kanał |
|---|---|---|---|
| Supply Chain Management Review | T2 | EN | https://www.scmr.com/rss/news |
| Supply Chain Dive | T2 | EN | https://www.supplychaindive.com/feeds/news/ |
| The Loadstar (fracht) | T2 | EN | https://theloadstar.com/feed/ |
| DC Velocity (magazyny) | T2 | EN | https://www.dcvelocity.com/feeds/feed.rss |
| logistyka.net.pl | T2 | PL | https://logistyka.net.pl/feed |
| wnp.pl: Logistyka | T2 | PL | https://www.wnp.pl/rss/logistyka_rss.xml |

### Przemysł i motoryzacja

| Źródło | Poziom | Język | Kanał |
|---|---|---|---|
| Manufacturing Dive | T2 | EN | https://www.manufacturingdive.com/feeds/news/ |
| wnp.pl: Przemysł | T2 | PL | https://www.wnp.pl/rss/przemysl_rss.xml |
| L'Usine Nouvelle | T2 | FR | https://www.usinenouvelle.com/arc/outboundfeeds/rss/ |
| Journal de l'Automobile | T2 | FR | https://journalauto.com/feed/ |

## Warte dodania, ale bez RSS

Te źródła nie mają działającego kanału RSS. Można je dodać w panelu jako **Lista na stronie** (`web_list`) z selektorami CSS. Zawsze zacznij od **Podglądu pobierania**.

| Źródło | Dlaczego | Uwagi |
|---|---|---|
| Planet Lean (Lean Global Network) | studia przypadków Lean z całego świata | lista artykułów na stronie głównej |
| trans.info | transport drogowy w Europie, stawki frachtowe, PL | ma też wersję polską; strona dynamiczna, może wymagać Jina Reader (płatny) |
| Sernauto | hiszpański przemysł motoryzacyjny (dostawcy) | sekcja aktualności |
| Agile Alliance | badania i konferencje Agile | blog i sekcja zasobów |
| ProKanban.org | społeczność Kanban (ścieżka alternatywna do Kanban University) | blog |
| Shingo Institute | nagrody i model Shingo | aktualności |
| The Hackett Group, Bain, BCG | benchmarki kosztów SG&A i operacji | dużo marketingu: tryb `editorial` z poziomem T2 albo tylko `hot_signal` |

Przykładowa konfiguracja listy na stronie (adres i selektory dopasuj do strony):

```json
{
  "url": "https://example.com/news",
  "parseMode": "html",
  "itemSelector": "article",
  "linkSelector": "h2 a",
  "titleSelector": "h2 a",
  "publishedAtSelector": "time",
  "publishedAtUtcOffset": "+01:00",
  "allowUrlPrefixes": ["https://example.com/news/"]
}
```

- `itemSelector` musi wskazywać **każdy wpis z osobna**, a nie kontener całej listy.
- `publishedAtUtcOffset`: strefa dla dat bez strefy (domyślnie `+01:00`). Daty w formacie `dd.mm.rrrr` oraz z polskimi, francuskimi i hiszpańskimi nazwami miesięcy serwis rozpoznaje sam.
- Pełny opis opcji (detale, Markdown, Jina Reader) jest po chińsku w [`docs/sources.md`](../sources.md); nazwy pól są te same.

## Newslettery

Wiele dobrych treści o Lean i OPEX przychodzi tylko e-mailem. Można je wysyłać do serwisu automatycznie: [newslettery-n8n.md](newslettery-n8n.md).

## Zasady

- Domyślnie serwis pokazuje tylko streszczenie i link do oryginału (`site_fulltext` wyłączone). Pełny tekst włączaj tylko wtedy, gdy źródło wyraźnie na to pozwala.
- Stare teksty nie zalewają strony: przy pierwszym imporcie źródła trafiają do archiwum według daty oryginału, nie do „dziś”.
- Źródło z błędami pobierania widać w panelu (**Źródła**, sortowanie według stanu) i w zakładce **Działanie**.
