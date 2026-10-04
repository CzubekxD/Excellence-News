# Serwis

Wszystko, co należy do tego konkretnego serwisu: nazwa, teksty, marka, strony i włączone moduły. Opis krok po kroku: [docs/pl/dostosowanie.md](../docs/pl/dostosowanie.md).

| Plik | Zawartość |
|---|---|
| `site.ts` | Nazwa, słowo branżowe, godziny wydań, teksty strony głównej i „O serwisie”, napisy na obrazkach udostępniania, sformułowania dziennika, tygodnika i miesięcznika, kategorie publicznego API |
| `models.ts` | Modele nazwane (Gemini, Groq, Cerebras, Mistral) i domyślny model każdego kroku |
| `brand/` | Ikony, logo (`Logo.tsx`), opcjonalne znaki słowne na obrazkach (`wordmark.svg`, `wordmark-dark.svg`), winiety wydań (`nameplates/`, generowane przez `scripts/nameplates.ts`), opcjonalne kody QR (`contact/`) |
| `pages/` | Zasady korzystania i prywatność (szablony do uzupełnienia przed startem) |
| `public/` | Pliki publikowane w katalogu głównym serwisu (z podmienionymi nazwą i adresem): `robots.txt`, `manifest.webmanifest`, `openapi-v1.json`, opcjonalnie `.well-known/security.txt` |
| `changelog.json` | Dziennik zmian |
| `modules/` | Włączone moduły: listy `index.ts`, `server.ts`, `web.ts` z modułami z katalogu `modules/<nazwa>/` (domyślnie puste) |
