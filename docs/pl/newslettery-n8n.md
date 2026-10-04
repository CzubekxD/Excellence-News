# Newslettery przez n8n

Część dobrych treści o Lean, OPEX i logistyce przychodzi tylko e-mailem. Serwis ma punkt `POST /api/ingest/items`: zewnętrzny skrypt wysyła na niego tytuły i linki, a serwis pobiera artykuły i przetwarza je jak każde inne źródło (odsiew, ocena, streszczenie, grupowanie). Poniżej przepływ w n8n: skrzynka pocztowa → wyciągnięcie linków → wysyłka do serwisu.

## 1. Token w serwisie

Wygeneruj losowy token (min. 16 znaków), np. `openssl rand -hex 24`, i dopisz go do `.env`:

```
INGEST_TOKEN=twoj_losowy_token
```

Potem `docker compose up -d`. Bez tokenu punkt odpowiada zawsze 401.

## 2. Osobna skrzynka na newslettery

Załóż osobny adres (np. darmowy Gmail z hasłem aplikacji albo alias w swojej domenie) i zapisz się na nim do newsletterów. Nie podpinaj prywatnej skrzynki.

## 3. Przepływ w n8n

1. **Email Trigger (IMAP)**: łączy się ze skrzynką newsletterów i reaguje na nowe wiadomości. Ustaw „Format: Resolved”, żeby dostać treść HTML.
2. **Code** (JavaScript): wyciąga linki do artykułów:

   ```javascript
   const SKIP = /unsubscribe|wypisz|preferences|manage|view.?in.?browser|facebook|linkedin\.com\/(?!pulse)|twitter|x\.com|instagram|youtube|mailto:/i;
   const out = [];
   for (const item of $input.all()) {
     const html = item.json.html ?? item.json.textHtml ?? "";
     const from = (item.json.from?.value?.[0]?.name ?? item.json.from ?? "Newsletter").toString();
     const date = item.json.date ? new Date(item.json.date).toISOString() : undefined;
     const seen = new Set();
     for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
       const url = m[1].replace(/&amp;/g, "&");
       const title = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
       if (!/^https?:\/\//.test(url) || SKIP.test(url) || title.length < 25 || seen.has(url)) continue;
       seen.add(url);
       out.push({ title: title.slice(0, 300), url, publishedAt: date, author: from });
     }
   }
   return [{ json: { items: out.slice(0, 50) } }];
   ```

   Linki w newsletterach często prowadzą przez przekierowania śledzące. Serwis podąża za przekierowaniem przy pobieraniu treści, ale zapisze link w postaci, w jakiej przyszedł. Jeśli dany newsletter ma stały wzorzec linków, warto go odfiltrować albo rozwinąć w tym kroku.

3. **IF**: przepuszcza dalej tylko wtedy, gdy `items` nie jest puste.
4. **HTTP Request**: wysyła wpisy do serwisu:
   - Method: `POST`
   - URL: `http://ADRES_SERWERA:3000/api/ingest/items` (n8n w tej samej sieci domowej) albo publiczny adres serwisu
   - Authentication: Generic → Header Auth, nagłówek `Authorization`, wartość `Bearer twoj_losowy_token`
   - Body (JSON):
     ```json
     {
       "sourceId": "newsletter-lean",
       "sourceName": "Newslettery Lean",
       "items": {{ JSON.stringify($json.items) }}
     }
     ```

Odpowiedź `{"ok": true, "created": N}` oznacza, że N nowych wpisów trafiło do kolejki.

Kilka grup newsletterów (np. Lean i logistyka) możesz rozdzielić na osobne `sourceId`: wtedy każda grupa ma w panelu osobne statystyki i ustawienia.

## 4. Włączenie źródła w panelu

Przy pierwszej wysyłce serwis sam tworzy źródło typu „Zewnętrzne” w trybie **izolowanym**: wpisy są przetwarzane, ale nic się nie publikuje. Gdy w panelu (**Źródła** → `newsletter-lean`) zobaczysz, że trafiają tam właściwe artykuły, zmień **Tryb udziału** na `editorial` i ustaw poziom (zwykle `T2`; `T1_5` dla newsletterów uznanych ekspertów).

## Ograniczenia

- Najwyżej 50 wpisów w jednym zapytaniu (inaczej 413) i domyślnie 10 zapytań na minutę na klienta (`INGEST_RATE_LIMIT`; potem 429).
- Wstrzymane źródło odpowiada 409, dopóki nie wznowisz go w panelu.
- Teksty starsze niż 48 godzin przy pierwszym wykryciu trafiają do archiwum według daty oryginału, a nie do „dziś”.
- Artykuły za paywallem dadzą tylko tytuł i to, co widać bez logowania; model oceni je ostrożniej.
